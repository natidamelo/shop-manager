import * as reportService from '../services/reportService.js';

export async function getFinancialReport(req, res, next) {
    try {
        const { from, to } = req.query;
        const shopId = req.user.shop_id || req.user.shop;
        const report = await reportService.getFinancialReport({ from, to, shopId });
        res.json(report);
    } catch (err) {
        next(err);
    }
}
