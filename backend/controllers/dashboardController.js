import * as dashboardService from '../services/dashboardService.js';

export async function getStats(req, res, next) {
  try {
    const stats = await dashboardService.getDashboardStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
}
