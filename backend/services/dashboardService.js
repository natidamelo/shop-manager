import Product from '../models/Product.js';
import Sale from '../models/Sale.js';

export async function getDashboardStats() {
  const [totalProducts, totalSales, lowStockCount, totalRevenueResult] = await Promise.all([
    Product.countDocuments(),
    Sale.countDocuments(),
    Product.countDocuments({ $expr: { $lte: ['$stock_quantity', '$low_stock_threshold'] } }),
    Sale.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: null, total: { $sum: '$total_amount' } } }]),
  ]);

  const recentSales = await Sale.find()
    .populate('customer', 'name')
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  const lowStockProducts = await Product.find({
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
    recentTransactions: recentSales.map((s) => ({
      ...s,
      id: s._id.toString(),
      customer_name: s.customer?.name || null,
      created_at: s.createdAt,
    })),
    lowStockProducts: lowStockProducts.map((p) => ({
      ...p,
      id: p._id.toString(),
    })),
  };
}
