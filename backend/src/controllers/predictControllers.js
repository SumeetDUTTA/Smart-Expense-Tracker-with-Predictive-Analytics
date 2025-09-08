import forecast from "../mlServices/mlService.js";
import Expense from "../models/expense.js";

export async function predict(req, res, next) {
    try {
        const horizonDate = req.body.horizonDates || 1;
        const rows = await Expense.aggregate([
            { $match: {user: req.user._id} },
            { $group: {
                _id: { $dateToString: { format: "%Y-%m", date: "$date"} },
                total: { $sum: "$amount" }
            }},
            { $sort: { _id: 1 }}
        ])
        const timeseries = rows.map(r => r.total);
        const prediction = await forecast(timeseries, horizonDate);
        res.json({ series: rows, prediction})
    } catch (error) {
        next(error);
    }
}