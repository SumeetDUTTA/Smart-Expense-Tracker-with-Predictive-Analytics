import { forecast } from "../mlServices/mlService.js";
import Expense from "../models/expense.js";
import ApiError from "../utils/ApiError.js";

export async function predict(req, res, next) {
    try {
        const horizon = Number(req.body.horizonDates) || 1;

        const rows = await Expense.aggregate([
            { $match: {user: req.user._id} },
            { $group: {
                _id: { 
                    month: { $dateToString: { format: "%Y-%m", date: "$date"} },
                    category: "$category",
                },
                total: { $sum: "$amount" }
            }},
            { $sort: { "_id.month": 1 }}
        ])

        if (!rows.length) throw new ApiError(400, 'Not enough data to generate prediction');
        const uniqueMonths = [...new Set(rows.map(r => r._id.month))].sort();
        const monthIndex = new Map(uniqueMonths.map((m, i) => [m, i]));

        const categoriesSet = new Set(rows.map(r => r._id.category || 'Uncategorized'));
        const categoryMap = {};
        
        for (const cat of categoriesSet) {
            categoryMap[cat] = Array(uniqueMonths.length).fill(0);
        };

        for (const row of rows) {
            const cat = row._id.category || 'Uncategorized';
            const idx = monthIndex.get(row._id.month);
            if (idx != null) {
                categoryMap[cat][idx] = Math.round(row.total);
            }
        };

        const MIN_POINTS = 6; // Balanced: use ML with 6+ months, but add safety checks
        const hasSparseCategory = Object.values(categoryMap).some(series => {
            const nonZero = series.filter(v => v > 0).length;
            return nonZero < MIN_POINTS;
        });

        const alignedTotal = uniqueMonths.map((_, i) => Object.values(categoryMap).reduce((sum, series) => sum + (series[i] || 0), 0));
        let result;
        const useTotalsOnly = hasSparseCategory || uniqueMonths.length < MIN_POINTS;
        if (useTotalsOnly) {
            // Use simple, reliable approach: recent average with small monthly growth
            const totalRecentWindow = 6;
            const tail = alignedTotal.slice(-totalRecentWindow);
            const nz = tail.filter(v => v > 0);
            const meanTotal = nz.length ? nz.reduce((a,b)=>a+b,0)/nz.length : 0;
            
            // Small consistent monthly growth (1-2%)
            const monthlyGrowth = 1.015; // 1.5% per month
            
            const totalPredLocal = Array.from({length: Math.max(1, horizon)}, (_, i) => {
                const step = i + 1;
                return Math.round(meanTotal * Math.pow(monthlyGrowth, step));
            });
            result = { categories: { Uncategorized: totalPredLocal.slice() }, total: totalPredLocal.slice(), predictionMethod: 'statistical_sparse_data' };
        } else {
            result = await forecast(categoryMap, horizon);
            
            // Add safety checks for ML predictions
            if (result && result.categories) {
                let needsFallback = false;
                const historicalTotalMean = alignedTotal.filter(v => v > 0).reduce((a,b) => a+b, 0) / Math.max(1, alignedTotal.filter(v => v > 0).length);
                
                // Check if ML predictions are reasonable
                if (result.total && result.total.length > 0) {
                    const predMean = result.total.reduce((a,b) => a+b, 0) / result.total.length;
                    const ratio = predMean / historicalTotalMean;
                    
                    console.log(`📊 Historical average: ₹${Math.round(historicalTotalMean)}`);
                    console.log(`🤖 ML predicted average: ₹${Math.round(predMean)}`);
                    console.log(`📈 Ratio: ${ratio.toFixed(2)}x`);
                    
                    // If ML predictions are more than 5x or less than 0.2x historical average, use fallback
                    if (!isFinite(ratio) || ratio > 5 || ratio < 0.2) {
                        console.warn(`ML predictions seem unrealistic (ratio: ${ratio}), falling back to statistical method`);
                        needsFallback = true;
                    } else {
                        console.log(`✅ ML predictions look reasonable, using ML results`);
                    }
                }
                
                if (needsFallback) {
                    // Fall back to the reliable statistical approach
                    const meanTotal = historicalTotalMean;
                    const monthlyGrowth = 1.015;
                    const totalPredLocal = Array.from({length: Math.max(1, horizon)}, (_, i) => {
                        const step = i + 1;
                        return Math.round(meanTotal * Math.pow(monthlyGrowth, step));
                    });
                    result = { categories: { Uncategorized: totalPredLocal.slice() }, total: totalPredLocal.slice(), predictionMethod: 'statistical_ml_unrealistic' };
                    
                    // Still need to distribute into categories
                    const recentWindow = 3;
                    const catAverages = Object.fromEntries(
                        Object.entries(categoryMap).map(([cat, series]) => {
                            const tail = series.slice(-recentWindow);
                            const nonZero = tail.filter(v => v > 0);
                            const avg = nonZero.length ? nonZero.reduce((a,b)=>a+b,0)/nonZero.length : 0;
                            return [cat, avg];
                        })
                    );
                    const sumAvg = Object.values(catAverages).reduce((a,b)=>a+b,0);
                    const proportions = Object.fromEntries(
                        Object.entries(catAverages).map(([cat, avg]) => [cat, sumAvg > 0 ? (avg / sumAvg) : (1 / Math.max(1, Object.keys(categoryMap).length))])
                    );
                    
                    const prediction_by_category = Object.fromEntries(Object.keys(categoryMap).map(k => [k, Array(totalPredLocal.length).fill(0)]));
                    totalPredLocal.forEach((t, i) => {
                        const rawAlloc = Object.entries(proportions).map(([cat, p]) => [cat, t * p]);
                        const floors = rawAlloc.map(([cat, val]) => [cat, Math.floor(val)]);
                        const sumFloors = floors.reduce((a,[,v]) => a + v, 0);
                        let remainder = Math.max(0, Math.round(t) - sumFloors);
                        const fracs = rawAlloc.map(([cat, val]) => [cat, val - Math.floor(val)]).sort((a,b) => b[1]-a[1]);
                        const allocation = new Map(floors);
                        for (let k = 0; k < fracs.length && remainder > 0; k++) {
                            const cat = fracs[k][0];
                            allocation.set(cat, (allocation.get(cat) || 0) + 1);
                            remainder--;
                        }
                        for (const [cat, val] of allocation.entries()) {
                            prediction_by_category[cat][i] = val;
                        }
                    });
                    result.categories = prediction_by_category;
                }
            }
        }

        if (!result || !result.categories || !result.total) {
            throw new ApiError(500, 'Prediction service returned invalid data');
        }

        const input_summary = Object.entries(categoryMap).map(([cat, series]) => {
            const nonZero = series.filter(v => v > 0);
            const months = nonZero.length;
            const average = months ? Math.round(nonZero.reduce((a, b) => a + b, 0) / months) : 0;
            return { category: cat, months, average };
        });

        // If totals-only mode was used, first scale total predictions to match recent historical totals,
        // then distribute back into categories using recent proportions.
        let prediction_by_category = result.categories;
        if (useTotalsOnly) {
            // Reference metrics for clamping
            const totalRecentWindow = 6;
            const tail = alignedTotal.slice(-totalRecentWindow);
            const nz = tail.filter(v => v > 0);
            const targetMean = nz.length ? nz.reduce((a,b)=>a+b,0)/nz.length : 0;
            const totalPred0 = Array.isArray(result.total) ? result.total : [];
            let totalPred = totalPred0.slice();

            // Per-step clamping around recent totals to avoid unrealistic swings,
            // tighter for nearer horizons, wider for later ones.
            const lastNZ = (() => {
                for (let i = alignedTotal.length - 1; i >= 0; i--) {
                    if (alignedTotal[i] > 0) return alignedTotal[i];
                }
                return 0;
            })();
            const baseRef = lastNZ > 0 ? lastNZ : targetMean;
            const stepBounds = [
                { lo: 0.80, hi: 1.25 },
                { lo: 0.70, hi: 1.35 },
                { lo: 0.60, hi: 1.45 },
            ];
            totalPred = totalPred.map((v, i) => {
                const b = i < stepBounds.length ? stepBounds[i] : stepBounds[stepBounds.length - 1];
                const lo = b.lo * baseRef;
                const hi = b.hi * baseRef;
                if (!isFinite(v)) return Math.round(targetMean || baseRef || 0);
                return Math.min(hi, Math.max(lo, v));
            });

            const recentWindow = 3; // number of months to compute proportions
            // Compute recent averages per category
            const catAverages = Object.fromEntries(
                Object.entries(categoryMap).map(([cat, series]) => {
                    const tail = series.slice(-recentWindow);
                    const nonZero = tail.filter(v => v > 0);
                    const avg = nonZero.length ? nonZero.reduce((a,b)=>a+b,0)/nonZero.length : 0;
                    return [cat, avg];
                })
            );
            const sumAvg = Object.values(catAverages).reduce((a,b)=>a+b,0);
            // If all averages are zero, fall back to equal split
            const proportions = Object.fromEntries(
                Object.entries(catAverages).map(([cat, avg]) => [cat, sumAvg > 0 ? (avg / sumAvg) : (1 / Math.max(1, Object.keys(categoryMap).length))])
            );
            
            // Distribute each horizon step while preserving integer total with rounding
            prediction_by_category = Object.fromEntries(Object.keys(categoryMap).map(k => [k, Array(totalPred.length).fill(0)]));
            totalPred.forEach((t, i) => {
                const rawAlloc = Object.entries(proportions).map(([cat, p]) => [cat, t * p]);
                // Floor all first, then distribute remainders to categories with largest fractional parts
                const floors = rawAlloc.map(([cat, val]) => [cat, Math.floor(val)]);
                const sumFloors = floors.reduce((a,[,v]) => a + v, 0);
                let remainder = Math.max(0, Math.round(t) - sumFloors);
                const fracs = rawAlloc.map(([cat, val]) => [cat, val - Math.floor(val)]).sort((a,b) => b[1]-a[1]);
                const allocation = new Map(floors);
                for (let k = 0; k < fracs.length && remainder > 0; k++) {
                    const cat = fracs[k][0];
                    allocation.set(cat, (allocation.get(cat) || 0) + 1);
                    remainder--;
                }
                // write allocations
                for (const [cat, val] of allocation.entries()) {
                    prediction_by_category[cat][i] = val;
                }
            });
            // Also update the total with the scaled-and-rounded version to reflect the allocations sum
            result.total = totalPred.map(v => Math.round(v));
        }

        // Log which prediction method was used
        const method = result.predictionMethod || 'unknown';
        const methodEmoji = {
            'ml_model': '🤖',
            'statistical': '📊',
            'statistical_sparse_data': '📉',
            'statistical_ml_unrealistic': '⚠️',
            'statistical_no_api': '⚙️',
            'statistical_ml_error': '🔧',
            'statistical_api_error': '🌐',
            'statistical_network_error': '📡',
            'statistical_low_spender_fallback': '💰',
            'statistical_moderate_spender_fallback': '📊',
            'statistical_high_spender_fallback': '💎',
            'statistical_very_high_spender_fallback': '🏰'
        };
        console.log(`${methodEmoji[method] || '❓'} Prediction method: ${method}`);

        res.status(200).json({
            success: true,
            message: 'Prediction generated successfully',
            input_summary,
            prediction_by_category,
            total_prediction: result.total,
            predictionMethod: method,
        });
    } catch (error) {
        console.error('Prediction error:', error);
        if (error instanceof ApiError) {
            return next(error);
        }
        next(new ApiError(500, 'Prediction failed', error));
    }
}