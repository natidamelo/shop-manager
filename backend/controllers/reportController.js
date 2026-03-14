import * as reportService from '../services/reportService.js';

export async function getFinancialReport(req, res, next) {
    try {
        const { from, to } = req.query;
        const report = await reportService.getFinancialReport({ from, to, shopId: req.user.shop_id });
        res.json(report);
    } catch (err) {
        next(err);
    }
}
