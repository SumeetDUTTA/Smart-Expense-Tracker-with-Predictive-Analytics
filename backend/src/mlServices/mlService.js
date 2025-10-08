import axios from 'axios';
import ApiError from '../utils/ApiError.js';

// Simple fallback: repeat mean when ML is unavailable or returns invalid data
function fallbackMean(timeseries, horizon) {
    const numeric = (Array.isArray(timeseries) ? timeseries : [])
        .map(n => Number(n))
        .filter(n => Number.isFinite(n));
    const mean = numeric.length ? numeric.reduce((a, b) => a + b, 0) / numeric.length : 0;
    return Array.from({ length: horizon }, () => Math.round(mean));
}

// Basic input sanitation to avoid NaN/undefined leaking to API
function sanitizeTimeseries(timeseries) {
    if (!Array.isArray(timeseries)) return [];
    return timeseries
        .map(n => Number(n))
        .filter(n => Number.isFinite(n) && n >= 0);
}

async function forecast(timeseries, horizonDates) {
    const base = process.env.ML_API_BASE_URL;

    // Validate inputs early
    const horizon = Number(horizonDates);
    if (!Number.isInteger(horizon) || horizon <= 0) {
        throw new ApiError(400, 'Invalid horizon (must be a positive integer)');
    }
    const ts = sanitizeTimeseries(timeseries);

    // No ML API configured → fallback
    if (!base) {
        return fallbackMean(ts, horizon);
    }

    try {
        const url = `${base.replace(/\/$/, '')}/predict`;
        const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
        if (process.env.ML_API_KEY) headers['x-api-key'] = process.env.ML_API_KEY;

        // API contract (from ml_api.py TimeseriesData): { timeseries: number[], horizon: number }
        const { data } = await axios.post(
            url,
            { timeseries: ts, horizon },
            { headers, timeout: 10000 }
        );

        // Server-side error shape: { error: string, predicted_expense_rupees: [...] }
        if (data?.error) {
            return fallbackMean(ts, horizon);
        }

        // Expected: { predicted_expense_rupees: number[] }
        const raw = Array.isArray(data?.predicted_expense_rupees) ? data.predicted_expense_rupees : null;
        if (!raw || raw.length === 0) {
            return fallbackMean(ts, horizon);
        }

        // Ensure length/horizon match; if API returns extra/short values, normalize
        const predictions = Array.from({ length: horizon }, (_, i) => {
            const val = raw[i] ?? raw[raw.length - 1] ?? 0;
            return Math.max(0, Math.round(Number(val) || 0));
        });

        return predictions;
    } catch (err) {
        // Network/timeout/axios error → fallback
        return fallbackMean(ts, horizon);
    }
}

export default forecast;