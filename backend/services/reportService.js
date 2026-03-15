import mongoose from 'mongoose';
console.log('Mongoose Version:', mongoose.version);
import Sale from '../models/Sale.js';
import Product from '../models/Product.js';
import Expense from '../models/Expense.js';

console.log('ReportService loaded. Mongoose exists:', !!mongoose);

/**
 * Build date range query helper
 */
function buildDateQuery(from, to) {
    const q = {};
    if (from && from !== '') {
        const d = new Date(from);
        if (!isNaN(d.getTime())) q.$gte = d;
    }
    if (to && to !== '') {
        const d = new Date(to);
        if (!isNaN(d.getTime())) {
            d.setHours(23, 59, 59, 999);
            q.$lte = d;
        }
    }
    return Object.keys(q).length ? q : null;
}

export async function getFinancialReport({ from, to, shopId } = {}) {
    console.log('Generating financial report for shopId:', shopId);
    
    if (!shopId) throw new Error('Shop ID required');
    
    let shopObjectId;
    try {
        if (!mongoose) throw new Error('Mongoose is not defined in reportService scope!');
        shopObjectId = new mongoose.Types.ObjectId(shopId);
    } catch (err) {
        console.error('Error converting shopId to ObjectId:', err);
        throw new Error(`Invalid Shop ID format or Mongoose missing: ${err.message}`);
    }

    const matchStage = { status: 'completed', shop: shopObjectId };
    const dateQ = buildDateQuery(from, to);
    if (dateQ) matchStage.createdAt = dateQ;

    try {
        // ── 1. Core revenue aggregation ─────────────────────────────────────────────
        const revenueResults = await Sale.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: { $ifNull: ['$total_amount', 0] } },
                    totalDiscount: { $sum: { $ifNull: ['$discount', 0] } },
                    totalTax: { $sum: { $ifNull: ['$tax', 0] } },
                    totalOrders: { $sum: 1 },
                    avgOrderValue: { $avg: { $ifNull: ['$total_amount', 0] } },
                },
            },
        ]);
        const revenueAgg = revenueResults[0] || {
            totalRevenue: 0, totalDiscount: 0, totalTax: 0, totalOrders: 0, avgOrderValue: 0
        };

        // ── 2. COGS aggregation ─────────────────────────────────────────────────────
        const cogsResults = await Sale.aggregate([
            { $match: matchStage },
            { $unwind: { path: '$items', preserveNullAndEmptyArrays: false } },
            {
                $group: {
                    _id: null,
                    cogs: {
                        $sum: { $multiply: [{ $ifNull: ['$items.quantity', 0] }, { $ifNull: ['$items.unit_cost', 0] }] },
                    },
                    unitsSold: { $sum: { $ifNull: ['$items.quantity', 0] } },
                },
            },
        ]);
        const cogsAgg = cogsResults[0] || { cogs: 0, unitsSold: 0 };

        // ── 3. Daily revenue trend ───────────────────────────────────────────────────
        const dailyTrend = await Sale.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    revenue: { $sum: { $ifNull: ['$total_amount', 0] } },
                    orders: { $sum: 1 },
                },
            },
            { $match: { _id: { $ne: null } } },
            { $sort: { '_id': 1 } },
            {
                $project: {
                    _id: 0,
                    date: '$_id',
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
                    _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                    revenue: { $sum: { $ifNull: ['$total_amount', 0] } },
                    orders: { $sum: 1 },
                },
            },
            { $match: { _id: { $ne: null } } },
            { $sort: { '_id': 1 } },
            {
                $project: {
                    _id: 0,
                    label: '$_id',
                    revenue: 1,
                    orders: 1,
                },
            },
        ]);

        // ── 5. Top-selling products ──────────────────────────────────────────────────
        const topProducts = await Sale.aggregate([
            { $match: matchStage },
            { $unwind: { path: '$items', preserveNullAndEmptyArrays: false } },
            {
                $group: {
                    _id: '$items.product',
                    product_name: { $first: '$items.product_name' },
                    unitsSold: { $sum: { $ifNull: ['$items.quantity', 0] } },
                    revenue: { $sum: { $ifNull: ['$items.subtotal', 0] } },
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
                    product_id: { 
                        $cond: [
                            { $or: [{ $eq: ['$_id', null] }, { $not: ['$_id'] }] }, 
                            'deleted', 
                            { $toString: '$_id' }
                        ] 
                    },
                    product_name: { $ifNull: ['$product_name', 'Unknown Product'] },
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
            { $unwind: { path: '$items', preserveNullAndEmptyArrays: false } },
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
                    _id: '$prod.category',
                    category_name: { $first: '$cat.name' },
                    revenue: { $sum: { $ifNull: ['$items.subtotal', 0] } },
                    unitsSold: { $sum: { $ifNull: ['$items.quantity', 0] } },
                },
            },
            { $sort: { revenue: -1 } },
            {
                $project: {
                    _id: 0,
                    category_name: { $ifNull: ['$category_name', 'Uncategorized'] },
                    revenue: 1,
                    unitsSold: 1,
                },
            },
        ]);

        // ── 7. Inventory snapshot ────────────────────────────────────────────────────
        const inventoryResults = await Product.aggregate([
            { $match: { shop: shopObjectId } },
            {
                $group: {
                    _id: null,
                    inventoryValue: { $sum: { $multiply: [{ $ifNull: ['$stock_quantity', 0] }, { $ifNull: ['$cost_price', 0] }] } },
                    retailValue: { $sum: { $multiply: [{ $ifNull: ['$stock_quantity', 0] }, { $ifNull: ['$price', 0] }] } },
                    totalProducts: { $sum: 1 },
                },
            },
        ]);
        const inventoryAgg = inventoryResults[0] || { inventoryValue: 0, retailValue: 0, totalProducts: 0 };

        // ── 8. Expense aggregation ───────────────────────────────────────────────────
        const expenseMatch = { shop: shopObjectId };
        if (dateQ) expenseMatch.date = dateQ;
        const expenseResults = await Expense.aggregate([
            { $match: expenseMatch },
            {
                $group: {
                    _id: null,
                    totalExpenses: { $sum: { $ifNull: ['$amount', 0] } },
                },
            },
        ]);
        const expenseAgg = expenseResults[0] || { totalExpenses: 0 };

        const expensesByCategory = await Expense.aggregate([
            { $match: expenseMatch },
            {
                $group: {
                    _id: '$category',
                    amount: { $sum: { $ifNull: ['$amount', 0] } },
                },
            },
            { $sort: { amount: -1 } },
        ]);

        // ── Assemble ─────────────────────────────────────────────────────────────────
        return {
            period: { from: from || null, to: to || null },
            summary: {
                totalRevenue: revenueAgg.totalRevenue,
                totalDiscount: revenueAgg.totalDiscount,
                totalTax: revenueAgg.totalTax,
                totalOrders: revenueAgg.totalOrders,
                avgOrderValue: revenueAgg.avgOrderValue,
                cogs: cogsAgg.cogs,
                grossProfit: revenueAgg.totalRevenue - cogsAgg.cogs,
                grossMargin: revenueAgg.totalRevenue > 0 ? ((revenueAgg.totalRevenue - cogsAgg.cogs) / revenueAgg.totalRevenue) * 100 : 0,
                totalExpenses: expenseAgg.totalExpenses,
                netProfit: (revenueAgg.totalRevenue - cogsAgg.cogs) - expenseAgg.totalExpenses,
                netMargin: revenueAgg.totalRevenue > 0 ? (((revenueAgg.totalRevenue - cogsAgg.cogs) - expenseAgg.totalExpenses) / revenueAgg.totalRevenue) * 100 : 0,
                unitsSold: cogsAgg.unitsSold,
            },
            expensesByCategory: (expensesByCategory || []).map(e => ({ category: e._id || 'Other', amount: e.amount })),
            inventory: {
                inventoryValue: inventoryAgg.inventoryValue,
                retailValue: inventoryAgg.retailValue,
                totalProducts: inventoryAgg.totalProducts,
            },
            dailyTrend: dailyTrend || [],
            monthlyTrend: monthlyTrend || [],
            topProducts: topProducts || [],
            categoryBreakdown: categoryBreakdown || [],
        };
    } catch (err) {
        console.error('Fatal error in aggregate pipeline:', err);
        throw err;
    }
}
