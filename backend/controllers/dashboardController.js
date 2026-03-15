import * as dashboardService from '../services/dashboardService.js';

export async function getStats(req, res, next) {
  try {
    const shopId = req.user.shop_id || req.user.shop;
    const stats = await dashboardService.getDashboardStats(shopId);
    res.json(stats);
  } catch (err) {
    next(err);
  }
}
