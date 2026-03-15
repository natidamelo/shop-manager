import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Sale from '../models/Sale.js';

console.log('DashboardService loaded. Mongoose exists:', !!mongoose);

export async function getDashboardStats(shopId) {
  if (!shopId) {
    return {
      totalProducts: 0,
      totalSales: 0,
      lowStockCount: 0,
      totalRevenue: 0,
      recentTransactions: [],
      lowStockProducts: [],
    };
  }

  let shopObjectId;
  try {
    if (!mongoose) throw new Error('Mongoose is not defined in dashboardService!');
    shopObjectId = new mongoose.Types.ObjectId(shopId);
  } catch (err) {
    console.error('Invalid shopId in getDashboardStats:', shopId, err);
    return {
      totalProducts: 0,
      totalSales: 0,
      lowStockCount: 0,
      totalRevenue: 0,
      recentTransactions: [],
      lowStockProducts: [],
    };
  }

  try {
    const [totalProducts, totalSales, lowStockCount, totalRevenueResult] = await Promise.all([
      Product.countDocuments({ shop: shopObjectId }),
      Sale.countDocuments({ shop: shopObjectId }),
      Product.countDocuments({ shop: shopObjectId, $expr: { $lte: ['$stock_quantity', '$low_stock_threshold'] } }),
      Sale.aggregate([
        { $match: { status: 'completed', shop: shopObjectId } },
        { $group: { _id: null, total: { $sum: { $ifNull: ['$total_amount', 0] } } } }
      ]),
    ]);

    const recentSales = await Sale.find({ shop: shopObjectId })
      .populate('customer', 'name')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const lowStockProducts = await Product.find({
      shop: shopObjectId,
      $expr: { $lte: ['$stock_quantity', '$low_stock_threshold'] },
    })
      .select('name sku stock_quantity low_stock_threshold')
      .sort({ stock_quantity: 1 })
      .limit(10)
      .lean();

    return {
      totalProducts,
      totalSales,
      lowStockCount,
      totalRevenue: totalRevenueResult[0]?.total ?? 0,
      recentTransactions: (recentSales || []).map((s) => ({
        ...s,
        id: s._id.toString(),
        customer_name: s.customer?.name || null,
        created_at: s.createdAt,
      })),
      lowStockProducts: (lowStockProducts || []).map((p) => ({
        ...p,
        id: p._id.toString(),
      })),
    };
  } catch (err) {
    console.error('Error in dashboard aggregation:', err);
    throw err;
  }
}
