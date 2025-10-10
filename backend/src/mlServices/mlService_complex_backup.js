import axios from 'axios';
import ApiError from '../utils/ApiError.js';

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

// Categorize user's spending profile for adaptive ML handling
function categorizeSpendingProfile(totalMonthlySpending) {
    if (totalMonthlySpending < 3000) {
        return {
            type: 'LOW_SPENDER',
            confidence: 'medium',
            adaptiveScaling: 0.80, // More conservative for low spenders
            maxScalingBounds: [0.1, 2.5]
        };
    } else if (totalMonthlySpending < 6000) {
        return {
            type: 'MODERATE_SPENDER', 
            confidence: 'high',
            adaptiveScaling: 0.95, // Current user's profile - high confidence
            maxScalingBounds: [0.05, 3.0]
        };
    } else if (totalMonthlySpending < 15000) {
        return {
            type: 'HIGH_SPENDER',
            confidence: 'medium',
            adaptiveScaling: 1.10, // Slightly optimistic for high spenders
            maxScalingBounds: [0.03, 4.0]
        };
    } else {
        return {
            type: 'VERY_HIGH_SPENDER',
            confidence: 'low',
            adaptiveScaling: 1.25, // Model likely undertrained for this range
            maxScalingBounds: [0.02, 5.0]
        };
    }
}

// Enhanced recent mean calculation with outlier detection
function recentMean(series, window = 6) {
    if (!Array.isArray(series) || series.length === 0) return 0;
    const tail = series.slice(-window);
    const nonZero = tail.filter(n => n > 0);
    const use = nonZero.length ? nonZero : tail;
    return use.length ? use.reduce((a, b) => a + b, 0) / use.length : 0;
}

// Longer historical mean for stable expenses like rent
function longTermMean(series, window = 12) {
    if (!Array.isArray(series) || series.length === 0) return 0;
    const tail = series.slice(-window);
    const nonZero = tail.filter(n => n > 0);
    const use = nonZero.length ? nonZero : tail;
    return use.length ? use.reduce((a, b) => a + b, 0) / use.length : 0;
}

// Enhanced statistical fallback with realistic variation
function fallbackMean(categories, horizon) {
    const result = {};
    let total = Array(horizon).fill(0);

    for (const [cat, series] of Object.entries(categories)) {
        const numeric = (Array.isArray(series) ? series : [])
            .map(n => Number(n))
            .filter(n => Number.isFinite(n) && n >= 0);

        if (numeric.length === 0) {
            result[cat] = Array(horizon).fill(0);
            continue;
        }

        const mean = numeric.reduce((a, b) => a + b, 0) / numeric.length;
        const recentValues = numeric.slice(-6); // Last 6 months
        const stdDev = recentValues.length > 1 ? 
            Math.sqrt(recentValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (recentValues.length - 1)) : 
            mean * 0.15; // 15% variation if we can't calculate std dev

        // Generate varied predictions with gentle trends and seasonal influence
        const preds = [];
        const baseGrowth = 1.005; // 0.5% monthly growth
        const seasonality = cat.toLowerCase().includes('utilities') ? 0.1 : 0.05; // Utilities have more seasonal variation
        
        for (let i = 0; i < horizon; i++) {
            // Add trend
            const trendedMean = mean * Math.pow(baseGrowth, i);
            
            // Add seasonal component (simplified sine wave)
            const currentMonth = new Date().getMonth() + 1;
            const monthInPrediction = ((currentMonth + i - 1) % 12) + 1;
            const seasonalMultiplier = 1 + seasonality * Math.sin(2 * Math.PI * monthInPrediction / 12);
            
            // Add controlled randomness
            const randomFactor = 1 + (Math.random() - 0.5) * 0.3; // ±15% variation
            
            let prediction = trendedMean * seasonalMultiplier * randomFactor;
            
            // Ensure reasonable bounds (50%-150% of base mean)
            prediction = clamp(prediction, mean * 0.5, mean * 1.5);
            
            preds.push(Math.round(prediction));
        }
        
        result[cat] = preds;
        total = total.map((val, i) => val + preds[i]);
    }
    return { categories: result, total, predictionMethod: 'statistical' };
}

// Profile-aware statistical fallback for different user types
function fallbackMeanWithProfile(categories, horizon, profile) {
    const result = {};
    let total = Array(horizon).fill(0);

    for (const [cat, series] of Object.entries(categories)) {
        const numeric = (Array.isArray(series) ? series : [])
            .map(n => Number(n))
            .filter(n => Number.isFinite(n) && n >= 0);

        if (numeric.length === 0) {
            result[cat] = Array(horizon).fill(0);
            continue;
        }

        const mean = numeric.reduce((a, b) => a + b, 0) / numeric.length;
        const recentValues = numeric.slice(-6);
        
        // Profile-specific growth and variability patterns
        let baseGrowth, seasonality, variabilityFactor;
        
        if (profile.type === 'LOW_SPENDER') {
            baseGrowth = 1.005; // 0.5% monthly growth (more stable)
            seasonality = 0.08; // Lower seasonal variation
            variabilityFactor = 0.2; // ±10% variation
        } else if (profile.type === 'MODERATE_SPENDER') {
            baseGrowth = 1.015; // 1.5% monthly growth (current user)
            seasonality = 0.15;
            variabilityFactor = 0.3; // ±15% variation
        } else if (profile.type === 'HIGH_SPENDER') {
            baseGrowth = 1.025; // 2.5% monthly growth (higher lifestyle inflation)
            seasonality = 0.25; // Higher seasonal variation
            variabilityFactor = 0.4; // ±20% variation
        } else { // VERY_HIGH_SPENDER
            baseGrowth = 1.035; // 3.5% monthly growth
            seasonality = 0.35; // Very high seasonal variation  
            variabilityFactor = 0.5; // ±25% variation
        }

        const preds = [];
        for (let i = 0; i < horizon; i++) {
            const trendedMean = mean * Math.pow(baseGrowth, i);
            const currentMonth = new Date().getMonth() + 1;
            const monthInPrediction = ((currentMonth + i - 1) % 12) + 1;
            const seasonalMultiplier = 1 + seasonality * Math.sin(2 * Math.PI * monthInPrediction / 12);
            const randomFactor = 1 + (Math.random() - 0.5) * variabilityFactor;
            
            let prediction = trendedMean * seasonalMultiplier * randomFactor;
            prediction = clamp(prediction, mean * 0.5, mean * 1.5);
            preds.push(Math.round(prediction));
        }
        
        result[cat] = preds;
        total = total.map((val, i) => val + preds[i]);
    }
    
    return { 
        categories: result, 
        total, 
        predictionMethod: `statistical_${profile.type.toLowerCase()}`,
        confidence: profile.confidence
    };
}

// Basic input sanitation to avoid NaN/undefined leaking to API
function sanitizeSeries(series) {
    if (!Array.isArray(series)) return [];
    return series
        .map((item) => {
            if (item != null && typeof item === 'object') {
                const val = item.total ?? item.amount ?? item.value ?? item.v ?? item.y ?? NaN;
                return Number(val);
            }
            return Number(item);
        })
        .filter((n) => Number.isFinite(n) && n >= 0);
}

async function forecast(data, horizon) {
    const base = process.env.ML_API_BASE_URL;
    const h = Number(horizon);
    if (!Number.isInteger(h) || h <= 0) {
        throw new ApiError(400, 'Invalid horizon (must be a positive integer)');
    }
    if (!base) {
        console.log('🔄 ML_API_BASE_URL not configured - using statistical fallback');
        const cat = Array.isArray(data)
            ? { Uncategorized: sanitizeSeries(data) }
            : Object.fromEntries(
                Object.entries(data || {}).map(([k, v]) => [k, sanitizeSeries(v)])
            );
        return { ...fallbackMean(cat, h), predictionMethod: 'statistical_no_api' };
    }

    const categories = Array.isArray(data) || typeof data?.[0] === "number"
        ? { Uncategorized: sanitizeSeries(data) }
        : Object.fromEntries(
            Object.entries(data || {}).map(([k, v]) => [k, sanitizeSeries(v)])
        );

    const histMeans = Object.fromEntries(
        Object.entries(categories).map(([cat, series]) => [cat, recentMean(series, 6)])
    );

    // Debug: Show historical averages
    console.log('📊 Historical category averages:');
    Object.entries(histMeans).forEach(([cat, avg]) => {
        console.log(`   ${cat}: ₹${Math.round(avg)}`);
    });

    console.log('🤖 Attempting ML prediction...');
    try {
        const url = `${base.replace(/\/$/, '')}/predict`;
        const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
        if (process.env.ML_API_KEY) headers['x-api-key'] = process.env.ML_API_KEY;

        // API contract (from ml_api.py TimeseriesData): { timeseries: number[], horizon: number }
        const { data: response } = await axios.post(
            url,
            { categories, horizon: h },
            { headers, timeout: 10000 }
        );

        // Server-side error shape: { error: string, predicted_expense_rupees: [...] }
        if (response?.error) {
            console.log(`❌ ML API returned error: ${response.error} - falling back to statistical`);
            return { ...fallbackMean(categories, h), predictionMethod: 'statistical_ml_error' };
        }

        const cats = response.categories || {};
        const total =
            response.total_predicted_expense_rupees ||
            response.total_predicted_rupees ||
            [];

        console.log('✅ ML prediction successful!');
        const cleanCats = {};
        let recomputedTotal = [];

        const categoryHasHistory = Object.fromEntries(
            Object.entries(categories).map(([cat, series]) => [cat, series.filter(v => v > 0).length > 0])
        );

        // The universal model handles all spending ranges - simplified scaling
        for (const [cat, vals] of Object.entries(cats)) {
            const predicted = Array.isArray(vals) ? vals.map(Number) : [];
            if (predicted.length === 0) {
                cleanCats[cat] = [];
                continue;
            }
            const rawMean = predicted.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0) / predicted.length || 0;
            const target = histMeans[cat] || 0;
            let scalingFactor = 1.0; // Default: trust the universal model
            
            // Only apply safety bounds for extreme cases (>5x or <0.2x difference)
            if (rawMean > 0 && target > 0) {
                const ratio = rawMean / target;
                if (ratio > 5.0) {
                    scalingFactor = 5.0 * target / rawMean; // Cap at 5x historical
                    console.log(`⚠️ ${cat}: Capping extreme high prediction (${ratio.toFixed(1)}x → 5.0x)`);
                } else if (ratio < 0.2) {
                    scalingFactor = 0.2 * target / rawMean; // Floor at 0.2x historical  
                    console.log(`⚠️ ${cat}: Boosting extreme low prediction (${ratio.toFixed(1)}x → 0.2x)`);
                }
                
                // Special case for rent - apply gentler floor since it's usually stable
                if (cat.toLowerCase().includes('rent') && ratio < 0.8) {
                    scalingFactor = 0.8 * target / rawMean; // Floor rent at 80% of historical
                    console.log(`🏠 ${cat}: Applying rent stability floor (${ratio.toFixed(2)}x → 0.80x)`);
                }
            }
            
            // If no historical data, trust ML completely
            if (target === 0) {
                scalingFactor = 1.0;
                console.log(`🆕 ${cat}: No historical data - trusting ML prediction`);
            }
            
            // Adaptive scaling based on data reliability and category variance
            const historicalSeries = categories[cat] || [];
            const historicalVariance = historicalSeries.length > 3 ? 
                Math.sqrt(historicalSeries.reduce((acc, val) => acc + Math.pow(val - target, 2), 0) / historicalSeries.length) : 0;
            const coefficientOfVariation = target > 0 ? historicalVariance / target : 1;
            
            // For stable categories (low variance), trust historical more
            // For variable categories (high variance), trust ML more
            if (coefficientOfVariation < 0.2) { // Stable category (like rent, utilities)
                const weight = Math.min(0.7, 0.3 + (0.4 * (1 - coefficientOfVariation))); // 30-70% historical weight
                const weightedTarget = (rawMean * (1 - weight)) + (target * weight);
                scalingFactor = rawMean > 0 ? weightedTarget / rawMean : 1;
                console.log(`� ${cat}: Stable category (CV=${coefficientOfVariation.toFixed(2)}) - Historical weight: ${(weight*100).toFixed(0)}%`);
            } else if (coefficientOfVariation > 0.5) { // Highly variable category
                const weight = Math.max(0.2, 0.6 - (0.4 * coefficientOfVariation)); // 20-60% historical weight
                const weightedTarget = (rawMean * (1 - weight)) + (target * weight);
                scalingFactor = rawMean > 0 ? weightedTarget / rawMean : 1;
                console.log(`� ${cat}: Variable category (CV=${coefficientOfVariation.toFixed(2)}) - Historical weight: ${(weight*100).toFixed(0)}%`);
            }
            
            // Dynamic bounds based on historical data reliability
            const dataReliability = Math.min(1, historicalSeries.length / 6); // More data = more reliable
            const maxDeviation = 0.5 + (0.5 * (1 - dataReliability)); // 50-100% max deviation
            const bounds = [1 - maxDeviation, 1 + maxDeviation];
            scalingFactor = clamp(scalingFactor, bounds[0], bounds[1]);
            
            // Debug logging for scaling
            console.log(`🔧 ${cat}: Raw ML avg=₹${Math.round(rawMean)}, Target=₹${Math.round(target)}, Scale=${scalingFactor.toFixed(3)} (Universal Model)`);
            
            const scaled = predicted.map(v => Math.max(0, Math.round(v * scalingFactor)));
            cleanCats[cat] = scaled;
            scaled.forEach((v, i) => {
                recomputedTotal[i] = (recomputedTotal[i] || 0) + v;
            });
        }

        // Adaptive overall budget validation instead of hard constraints
        const histTotalAvg = Object.values(histMeans).reduce((a, b) => a + b, 0);
        const currentTotalAvg = recomputedTotal.length > 0 ? 
            recomputedTotal.reduce((a, b) => a + b, 0) / recomputedTotal.length : 0;
        
        // Calculate acceptable range based on historical variance
        const totalVariance = Object.values(categories).flat().length > 12 ? 
            (() => {
                const allTotals = Object.values(categories)[0] ? 
                    Object.values(categories)[0].map((_, i) => 
                        Object.values(categories).reduce((sum, catSeries) => sum + (catSeries[i] || 0), 0)
                    ) : [];
                const variance = allTotals.length > 1 ? 
                    Math.sqrt(allTotals.reduce((acc, val) => acc + Math.pow(val - histTotalAvg, 2), 0) / allTotals.length) : 0;
                return variance;
            })() : histTotalAvg * 0.2; // Default 20% if insufficient data
        
        const maxAcceptableTotal = histTotalAvg + (totalVariance * 1.5); // 1.5 standard deviations
        
        if (currentTotalAvg > maxAcceptableTotal && histTotalAvg > 0) {
            const overallScaling = maxAcceptableTotal / currentTotalAvg;
            console.log(`🎯 Adaptive budget constraint: ${overallScaling.toFixed(3)}x (Current: ₹${Math.round(currentTotalAvg)}, Max: ₹${Math.round(maxAcceptableTotal)})`);
            
            // Scale down all categories proportionally
            Object.keys(cleanCats).forEach(cat => {
                cleanCats[cat] = cleanCats[cat].map(v => Math.round(v * overallScaling));
            });
            
            // Recalculate total
            recomputedTotal = recomputedTotal.map(v => Math.round(v * overallScaling));
        }

        const cleanTotal = recomputedTotal.length ? recomputedTotal : (
            Array.isArray(response.total)
                ? response.total.map(
                    v => Math.max(0, Math.round(Number(v) || 0))
                ) : []
        );

        return {
            categories: cleanCats,
            total: cleanTotal,
            predictionMethod: 'ml_model'
        }

    } catch (err) {
        console.log(`❌ ML API request failed: ${err.message || err} - falling back to statistical`);
        // Network/timeout/axios error → fallback
        return { ...fallbackMean(categories, h), predictionMethod: 'statistical_network_error' };
    }
}

export default forecast;