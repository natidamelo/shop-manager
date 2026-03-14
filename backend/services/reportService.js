import Sale from '../models/Sale.js';
import Product from '../models/Product.js';

/**
 * Build date range query helper
 */
function buildDateQuery(from, to) {
    const q = {};
    if (from) q.$gte = new Date(from);
    if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        q.$lte = end;
    }
    return Object.keys(q).length ? q : null;
}

export async function getFinancialReport({ from, to } = {}) {
    const matchStage = { status: 'completed' };
    const dateQ = buildDateQuery(from, to);
    if (dateQ) matchStage.createdAt = dateQ;

    // ── 1. Core revenue aggregation ─────────────────────────────────────────────
    const [revenueAgg] = await Sale.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: '$total_amount' },
                totalDiscount: { $sum: '$discount' },
                totalTax: { $sum: '$tax' },
                totalOrders: { $sum: 1 },
                avgOrderValue: { $avg: '$total_amount' },
            },
        },
    ]);

    // ── 2. COGS from saved unit_cost in sale items ──────────────────────────────
    const cogsAgg = await Sale.aggregate([
        { $match: matchStage },
        { $unwind: '$items' },
        {
            $group: {
                _id: null,
                cogs: {
                    $sum: { $multiply: ['$items.quantity', { $ifNull: ['$items.unit_cost', 0] }] },
                },
                unitsSold: { $sum: '$items.quantity' },
            },
        },
    ]);

    // ── 3. Daily revenue trend ───────────────────────────────────────────────────
    const dailyTrend = await Sale.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' },
                    day: { $dayOfMonth: '$createdAt' },
                },
                revenue: { $sum: '$total_amount' },
                orders: { $sum: 1 },
            },
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
        {
            $project: {
                _id: 0,
                date: {
                    $dateToString: {
                        format: '%Y-%m-%d',
                        date: {
                            $dateFromParts: {
                                year: '$_id.year',
                                month: '$_id.month',
                                day: '$_id.day',
                            },
                        },
                    },
                },
                revenue: 1,
                orders: 1,
            },
        },
    ]);

    // ── 4. Monthly revenue trend ─────────────────────────────────────────────────
    const monthlyTrend = await Sale.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' },
                },
                revenue: { $sum: '$total_amount' },
                orders: { $sum: 1 },
            },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        {
            $project: {
                _id: 0,
                label: {
                    $concat: [
                        { $toString: '$_id.year' },
                        '-',
                        {
                            $cond: [
                                { $lt: ['$_id.month', 10] },
                                { $concat: ['0', { $toString: '$_id.month' }] },
                                { $toString: '$_id.month' },
                            ],
                        },
                    ],
                },
                revenue: 1,
                orders: 1,
            },
        },
    ]);

    // ── 5. Top-selling products ──────────────────────────────────────────────────
    const topProducts = await Sale.aggregate([
        { $match: matchStage },
        { $unwind: '$items' },
        {
            $group: {
                _id: '$items.product',
                product_name: { $first: '$items.product_name' },
                unitsSold: { $sum: '$items.quantity' },
                revenue: { $sum: '$items.subtotal' },
            },
        },
        { $sort: { revenue: -1 } },
        { $limit: 10 },
        {
            $lookup: {
                from: 'products',
                localField: '_id',
                foreignField: '_id',
                as: 'prod',
            },
        },
        { $unwind: { path: '$prod', preserveNullAndEmptyArrays: true } },
        {
            $project: {
                _id: 0,
                product_id: { $toString: '$_id' },
                product_name: 1,
                unitsSold: 1,
                revenue: 1,
                cost_price: { $ifNull: ['$prod.cost_price', 0] },
                cogs: { $multiply: ['$unitsSold', { $ifNull: ['$prod.cost_price', 0] }] },
            },
        },
        {
            $addFields: {
                grossProfit: { $subtract: ['$revenue', '$cogs'] },
            },
        },
    ]);

    // ── 6. Category breakdown ────────────────────────────────────────────────────
    const categoryBreakdown = await Sale.aggregate([
        { $match: matchStage },
        { $unwind: '$items' },
        {
            $lookup: {
                from: 'products',
                localField: 'items.product',
                foreignField: '_id',
                as: 'prod',
            },
        },
        { $unwind: { path: '$prod', preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: 'categories',
                localField: 'prod.category',
                foreignField: '_id',
                as: 'cat',
            },
        },
        { $unwind: { path: '$cat', preserveNullAndEmptyArrays: true } },
        {
            $group: {
                _id: { $ifNull: ['$prod.category', 'uncategorized'] },
                category_name: { $first: { $ifNull: ['$cat.name', 'Uncategorized'] } },
                revenue: { $sum: '$items.subtotal' },
                unitsSold: { $sum: '$items.quantity' },
            },
        },
        { $sort: { revenue: -1 } },
        {
            $project: {
                _id: 0,
                category_name: 1,
                revenue: 1,
                unitsSold: 1,
            },
        },
    ]);

    // ── 7. Inventory value snapshot ──────────────────────────────────────────────
    const [inventoryAgg] = await Product.aggregate([
        {
            $group: {
                _id: null,
                inventoryValue: { $sum: { $multiply: ['$stock_quantity', '$cost_price'] } },
                retailValue: { $sum: { $multiply: ['$stock_quantity', '$price'] } },
                totalProducts: { $sum: 1 },
            },
        },
    ]);

    // ── Assemble ─────────────────────────────────────────────────────────────────
    const totalRevenue = revenueAgg?.totalRevenue ?? 0;
    const cogs = cogsAgg[0]?.cogs ?? 0;
    const grossProfit = totalRevenue - cogs;
    const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    return {
        period: { from: from || null, to: to || null },
        summary: {
            totalRevenue,
            totalDiscount: revenueAgg?.totalDiscount ?? 0,
            totalTax: revenueAgg?.totalTax ?? 0,
            totalOrders: revenueAgg?.totalOrders ?? 0,
            avgOrderValue: revenueAgg?.avgOrderValue ?? 0,
            cogs,
            grossProfit,
            grossMargin,
            unitsSold: cogsAgg[0]?.unitsSold ?? 0,
        },
        inventory: {
            inventoryValue: inventoryAgg?.inventoryValue ?? 0,
            retailValue: inventoryAgg?.retailValue ?? 0,
            totalProducts: inventoryAgg?.totalProducts ?? 0,
        },
        dailyTrend,
        monthlyTrend,
        topProducts,
        categoryBreakdown,
    };
}
