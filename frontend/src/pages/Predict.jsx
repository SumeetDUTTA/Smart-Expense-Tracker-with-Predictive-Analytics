import React, { useState } from "react";
import api from "../lib/api";
import { TrendingUp, Calendar, DollarSign, BarChart3, Eye, EyeOff, Sparkles, LoaderIcon } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import toast from "react-hot-toast";

function normalizeTotalPrediction(tp) {
	try {
		if (Array.isArray(tp)) return tp
		if (typeof tp === 'number') return [tp]
		if (tp && typeof tp === 'object') {
			const keys = Object.keys(tp)
			const numericKeys = keys.every(k => !Number.isNaN(Date.parse(k)) || !isNaN(Number(k)))
			if (numericKeys) {
				return keys
					.slice()
					.sort((a, b) => {
						const da = Date.parse(a)
						const db = Date.parse(b)
						if (!Number.isNaN(da) && !Number.isNaN(db)) return da - db
						return (Number(a) || 0) - (Number(b) || 0)
					})
					.map(k => tp[k])
			}
			return Object.values(tp)
		}
	} catch (err) {
		console.error('normalizeTotalPrediction error:', err, tp)
	}
	return [] // <-- GUARANTEED fallback
}

export default function Predict() {
	const [horizon, setHorizon] = useState(3)
	const [result, setResult] = useState(null)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState(null)
	const [showBreakdown, setShowBreakdown] = useState(false)

	async function submit(e) {
		e && e.preventDefault()
		setLoading(true)
		setError(null)
		try {
			const res = await api.post('/predict', { horizonDates: Number(horizon) })
			console.log('predict response:', res.data)
			setResult(res.data)
			setShowBreakdown(false)
			toast.success('Prediction generated successfully!')
		} catch (e) {
			const errorMsg = e.response?.data?.message || e.message
			setError(errorMsg)
			setResult(null)
			toast.error(errorMsg)
		} finally {
			setLoading(false)
		}
	}

	// Defensive normalization with try/catch/fallback
	const totalPredRaw = result?.total_prediction
	let totalPredArray = []
	try {
		totalPredArray = normalizeTotalPrediction(totalPredRaw) || []
	} catch (err) {
		console.error('Error normalizing total_prediction:', err, totalPredRaw)
		totalPredArray = []
	}

	// ALWAYS use a safe array fallback before .map
	const chartData = (totalPredArray || []).map((v, i) => ({ name: `T+${i + 1}`, value: v }))

	const totalDisplay = (Array.isArray(totalPredArray) && totalPredArray.length > 0)
		? totalPredArray.reduce((s, x) => s + (Number(x) || 0), 0)
		: (typeof totalPredRaw === 'number' ? totalPredRaw : null)

	const byCategory = result?.prediction_by_category || {}

	if (loading) {
		return <div className='min-h-screen bg-base-200 flex items-center justify-center'>
			<LoaderIcon className='size-10 animate-spin text-primary' />
		</div>
	}

	return (
		<div className="space-y-6 animate-fade-in">
			{/* Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div>
					<h2 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">Expense Prediction</h2>
					<p className="text-base-content/60 mt-1">AI-powered forecasting for your future expenses</p>
				</div>
			</div>

			{/* Prediction Form */}
			<div className="card bg-base-100 shadow-xl card-hover border border-base-300">
				<div className="card-body">
					<h3 className="card-title text-xl mb-4 flex items-center gap-2">
						<Sparkles className="text-primary" size={24} />
						Generate Prediction
					</h3>

					<form onSubmit={submit} className="space-y-4">
						<div className="form-control">
							<label className="label">
								<span className="label-text font-medium flex items-center gap-2">
									<Calendar size={18} />
									Forecast Horizon (months)
								</span>
							</label>
							<div className="flex gap-4 items-center">
								<input
									type="range"
									min="1"
									max="12"
									value={horizon}
									onChange={(e) => setHorizon(e.target.value)}
									className="range range-primary flex-1"
									step="1"
								/>
								<div className="bg-primary/10 px-6 py-3 rounded-lg min-w-[80px] text-center">
									<span className="text-2xl font-bold text-primary">{horizon}</span>
									<span className="text-xs text-base-content/60 block">months</span>
								</div>
							</div>
							<div className="flex justify-between text-xs text-base-content/60 mt-1 px-2">
								<span>1 month</span>
								<span>6 months</span>
								<span>12 months</span>
							</div>
						</div>

						<button
							type="submit"
							className={`btn btn-gradient w-full gap-2 shadow-lg ${loading ? 'loading' : ''}`}
							disabled={loading}
						>
							{!loading && <TrendingUp size={20} />}
							{loading ? 'Generating Prediction...' : 'Generate Prediction'}
						</button>
					</form>
				</div>
			</div>

			{/* Loading State */}
			{loading && (
				<div className="card bg-base-100 shadow-xl animate-pulse">
					<div className="card-body items-center text-center py-16">
						<span className="loading loading-spinner loading-lg text-primary"></span>
						<p className="text-base-content/60 mt-4">Analyzing your spending patterns...</p>
					</div>
				</div>
			)}

			{/* Error State */}
			{error && (
				<div className="alert alert-error shadow-lg animate-slide-down">
					<div>
						<svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						<span>{error}</span>
					</div>
				</div>
			)}

			{/* Results */}
			{result && !loading && (
				<div className="space-y-6 animate-fade-in">
					{/* Summary Card */}
					<div className="card bg-gradient-primary text-white shadow-xl card-hover">
						<div className="card-body">
							<div className="flex items-center justify-between">
								<div className="flex-1">
									<p className="text-sm opacity-90 font-medium flex items-center gap-2">
										<DollarSign size={18} />
										Total Predicted Expenses
									</p>
									<h2 className="text-5xl font-bold mt-3 number-animate">
										{totalDisplay != null ? `₹${totalDisplay.toFixed(2)}` : '—'}
									</h2>
									<p className="text-sm opacity-80 mt-2">
										For the next {horizon} {horizon === 1 ? 'month' : 'months'}
									</p>
								</div>
								<div className="bg-white/20 p-4 rounded-xl">
									<TrendingUp size={48} />
								</div>
							</div>
						</div>
					</div>

					{/* Chart Visualization */}
					{chartData.length > 0 && (
						<div className="card bg-base-100 shadow-xl card-hover border border-base-300">
							<div className="card-body">
								<h3 className="card-title flex items-center gap-2 mb-4">
									<BarChart3 className="text-primary" size={24} />
									Prediction Trend
								</h3>

								<ResponsiveContainer width="100%" height={300}>
									<BarChart data={chartData}>
										<CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
										<XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
										<YAxis stroke="#6b7280" fontSize={12} />
										<Tooltip
											contentStyle={{
												backgroundColor: 'white',
												border: '1px solid #e5e7eb',
												borderRadius: '8px',
												boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
											}}
											formatter={(value) => [`₹${Number(value).toFixed(2)}`, 'Predicted Amount']}
										/>
										<Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} />
									</BarChart>
								</ResponsiveContainer>

								<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
									{chartData.slice(0, 4).map((item, idx) => (
										<div key={idx} className="stat bg-base-200 rounded-lg p-4">
											<div className="stat-title text-xs">{item.name}</div>
											<div className="stat-value text-primary text-lg">₹{Number(item.value).toFixed(0)}</div>
										</div>
									))}
								</div>
							</div>
						</div>
					)}

					{/* Category Breakdown Toggle */}
					<div className="card bg-base-100 shadow-xl card-hover border border-base-300">
						<div className="card-body">
							<div className="flex items-center justify-between">
								<h3 className="card-title flex items-center gap-2">
									<BarChart3 className="text-secondary" size={24} />
									Category Breakdown
								</h3>
								<button
									onClick={() => setShowBreakdown(s => !s)}
									className="btn btn-outline btn-sm gap-2"
								>
									{showBreakdown ? <EyeOff size={16} /> : <Eye size={16} />}
									{showBreakdown ? 'Hide' : 'Show'}
								</button>
							</div>

							{showBreakdown && (
								<div className="mt-6 animate-slide-down">
									{Object.keys(byCategory).length === 0 ? (
										<div className="text-center py-8 text-base-content/60">
											<BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
											<p>No category predictions available</p>
										</div>
									) : (
										<div className="overflow-x-auto">
											<table className="table table-zebra w-full">
												<thead className="bg-base-200">
													<tr>
														<th className="font-bold">Category</th>
														{(chartData.length > 0 ? chartData : [{ name: `T+1` }]).map(c => (
															<th key={c.name} className="font-bold text-center">{c.name}</th>
														))}
													</tr>
												</thead>
												<tbody>
													{Object.entries(byCategory).map(([cat, arr]) => (
														<tr key={cat} className="hover">
															<td className="font-semibold">
																<span className="badge badge-primary">{cat}</span>
															</td>
															{Array.isArray(arr) ? arr.map((v, i) => (
																<td key={i} className="text-center font-bold text-primary">
																	₹{Number(v).toFixed(2)}
																</td>
															)) : (
																<td className="text-center">{String(arr)}</td>
															)}
														</tr>
													))}
												</tbody>
											</table>
										</div>
									)}
								</div>
							)}
						</div>
					</div>

					{/* Tips Card */}
					<div className="alert shadow-lg bg-info/10 border border-info/20">
						<div>
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-info shrink-0 w-6 h-6">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
							</svg>
							<div>
								<h3 className="font-bold">Prediction Insights</h3>
								<div className="text-sm">
									These predictions are based on your historical spending patterns.
									Actual expenses may vary based on seasonal changes and personal circumstances.
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}