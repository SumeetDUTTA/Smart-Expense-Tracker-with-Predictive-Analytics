/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { TrendingUp, TrendingDown, Wallet, Calendar, ArrowRight, PieChart, DollarSign, Target, Activity } from "lucide-react";
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from "recharts";
import toast from "react-hot-toast";

export default function Dashboard() {
	const [stats, setStats] = useState({
		thisMonth: 0,
		lastMonth: 0,
		total: 0,
		recentExpenses: [],
		categoryBreakdown: {},
		last6Months: [],
		dailyAverage: 0,
		transactionCount: 0
	});
	const [loading, setLoading] = useState(true);
	const [chartView, setChartView] = useState('category'); // 'category' or 'trend'

	useEffect(() => {
		fetchDashboardData();
	}, []);

	async function fetchDashboardData() {
		setLoading(true);
		try {
			const res = await api.get("/expenses");
			const expenses = res.data || [];

			const now = new Date();
			const thisMonth = now.getMonth();
			const thisYear = now.getFullYear();
			const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
			const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

			const thisMonthExpenses = expenses.filter(e => {
				const d = new Date(e.date);
				return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
			});

			const lastMonthExpenses = expenses.filter(e => {
				const d = new Date(e.date);
				return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
			});

			const thisMonthTotal = thisMonthExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
			const lastMonthTotal = lastMonthExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
			const total = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

			// Category breakdown for this month
			const categoryMap = {};
			thisMonthExpenses.forEach(e => {
				categoryMap[e.category] = (categoryMap[e.category] || 0) + (Number(e.amount) || 0);
			});

			// Last 6 months trend
			const last6Months = [];
			for (let i = 5; i >= 0; i--) {
				const monthDate = new Date(thisYear, thisMonth - i, 1);
				const monthName = monthDate.toLocaleDateString('en-US', { month: 'short' });
				const monthExpenses = expenses.filter(e => {
					const d = new Date(e.date);
					return d.getMonth() === monthDate.getMonth() && d.getFullYear() === monthDate.getFullYear();
				});
				const monthTotal = monthExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
				last6Months.push({ month: monthName, amount: monthTotal });
			}

			// Daily average
			const daysThisMonth = new Date(thisYear, thisMonth + 1, 0).getDate();
			const dailyAverage = thisMonthTotal / daysThisMonth;

			setStats({
				thisMonth: thisMonthTotal,
				lastMonth: lastMonthTotal,
				total,
				recentExpenses: expenses.slice(0, 5).sort((a, b) => new Date(b.date) - new Date(a.date)),
				categoryBreakdown: categoryMap,
				last6Months,
				dailyAverage,
				transactionCount: thisMonthExpenses.length
			});
		} catch (error) {
			console.error(error);
			toast.error("Failed to load dashboard data");
		} finally {
			setLoading(false);
		}
	}

	const percentChange = stats.lastMonth === 0 ? 0 : ((stats.thisMonth - stats.lastMonth) / stats.lastMonth) * 100;
	const isIncrease = percentChange > 0;

	const topCategories = Object.entries(stats.categoryBreakdown)
		.sort(([, a], [, b]) => b - a)
		.slice(0, 5);

	// Colors for pie chart
	const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

	const pieChartData = topCategories.map(([category, amount]) => ({
		name: category,
		value: amount
	}));

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<span className="loading loading-spinner loading-lg text-primary"></span>
			</div>
		);
	}

	return (
		<div className="space-y-6 animate-fade-in">
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div>
					<h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">Dashboard</h1>
					<p className="text-base-content/60 mt-1">Welcome back! Here's your comprehensive spending overview</p>
				</div>
				<Link to="/expenses" className="btn btn-gradient gap-2 shadow-lg">
					<Wallet size={20} />
					Add Expense
				</Link>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				<div className="card bg-gradient-primary text-white shadow-xl card-hover">
					<div className="card-body">
						<div className="flex items-start justify-between">
							<div className="flex-1">
								<p className="text-sm opacity-90 font-medium">This Month</p>
								<h2 className="text-3xl font-bold mt-2 number-animate">₹{stats.thisMonth.toFixed(2)}</h2>
								<div className={`inline-flex items-center gap-2 mt-3 px-3 py-1 rounded-full ${isIncrease ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
									{isIncrease ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
									<span className="text-xs font-semibold">{Math.abs(percentChange).toFixed(1)}% vs last month</span>
								</div>
							</div>
							<div className="bg-white/20 p-3 rounded-xl">
								<Wallet size={28} />
							</div>
						</div>
					</div>
				</div>

				<div className="card bg-base-100 shadow-xl card-hover border border-base-300">
					<div className="card-body">
						<div className="flex items-start justify-between">
							<div className="flex-1">
								<p className="text-sm text-base-content/60 font-medium">Daily Average</p>
								<h2 className="text-3xl font-bold mt-2 text-primary number-animate">₹{stats.dailyAverage.toFixed(2)}</h2>
								<p className="text-xs text-base-content/50 mt-3">{stats.transactionCount} transactions</p>
							</div>
							<div className="bg-primary/10 p-3 rounded-xl text-primary">
								<Activity size={28} />
							</div>
						</div>
					</div>
				</div>

				<div className="card bg-base-100 shadow-xl card-hover border border-base-300">
					<div className="card-body">
						<div className="flex items-start justify-between">
							<div className="flex-1">
								<p className="text-sm text-base-content/60 font-medium">Last Month</p>
								<h2 className="text-3xl font-bold mt-2 number-animate">₹{stats.lastMonth.toFixed(2)}</h2>
								<p className="text-xs text-base-content/50 mt-3">Previous period</p>
							</div>
							<div className="bg-secondary/10 p-3 rounded-xl text-secondary">
								<Calendar size={28} />
							</div>
						</div>
					</div>
				</div>

				<div className="card bg-base-100 shadow-xl card-hover border border-base-300">
					<div className="card-body">
						<div className="flex items-start justify-between">
							<div className="flex-1">
								<p className="text-sm text-base-content/60 font-medium">Total Spending</p>
								<h2 className="text-3xl font-bold mt-2 text-success number-animate">₹{stats.total.toFixed(2)}</h2>
								<p className="text-xs text-base-content/50 mt-3">All time</p>
							</div>
							<div className="bg-success/10 p-3 rounded-xl text-success">
								<DollarSign size={28} />
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Charts Section */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Spending Trend Chart */}
				<div className="card bg-base-100 shadow-xl card-hover border border-base-300">
					<div className="card-body">
						<div className="flex items-center justify-between mb-4">
							<h2 className="card-title flex items-center gap-2">
								<Activity size={24} className="text-primary" />
								6-Month Trend
							</h2>
						</div>

						{stats.last6Months.length > 0 ? (
							<ResponsiveContainer width="100%" height={250}>
								<LineChart data={stats.last6Months}>
									<CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
									<XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
									<YAxis stroke="#6b7280" fontSize={12} />
									<Tooltip
										contentStyle={{
											backgroundColor: 'white',
											border: '1px solid #e5e7eb',
											borderRadius: '8px',
											boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
										}}
										formatter={(value) => [`₹${value.toFixed(2)}`, 'Amount']}
									/>
									<Line
										type="monotone"
										dataKey="amount"
										stroke="#6366f1"
										strokeWidth={3}
										dot={{ fill: '#6366f1', r: 5 }}
										activeDot={{ r: 7 }}
									/>
								</LineChart>
							</ResponsiveContainer>
						) : (
							<p className="text-center text-base-content/60 py-16">No data available</p>
						)}
					</div>
				</div>

				{/* Category Distribution */}
				<div className="card bg-base-100 shadow-xl card-hover border border-base-300">
					<div className="card-body">
						<div className="flex items-center justify-between mb-4">
							<h2 className="card-title flex items-center gap-2">
								<PieChart size={24} className="text-secondary" />
								Category Distribution
							</h2>
						</div>

						{pieChartData.length > 0 ? (
							<div className="flex flex-col items-center">
								<ResponsiveContainer width="100%" height={200}>
									<RechartsPie>
										<Pie
											data={pieChartData}
											cx="50%"
											cy="50%"
											labelLine={false}
											label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
											outerRadius={80}
											fill="#8884d8"
											dataKey="value"
										>
											{pieChartData.map((entry, index) => (
												<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
											))}
										</Pie>
										<Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
									</RechartsPie>
								</ResponsiveContainer>
								<div className="flex flex-wrap gap-2 justify-center mt-4">
									{pieChartData.map((entry, index) => (
										<div key={entry.name} className="flex items-center gap-2">
											<div
												className="w-3 h-3 rounded-full"
												style={{ backgroundColor: COLORS[index % COLORS.length] }}
											/>
											<span className="text-xs">{entry.name}</span>
										</div>
									))}
								</div>
							</div>
						) : (
							<p className="text-center text-base-content/60 py-16">No spending data this month</p>
						)}
					</div>
				</div>
			</div>

			{/* Recent Expenses & Top Categories */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<div className="card bg-base-100 shadow-xl card-hover border border-base-300">
					<div className="card-body">
						<div className="flex items-center justify-between mb-4">
							<h2 className="card-title">Recent Expenses</h2>
							<Link to="/expenses" className="btn btn-ghost btn-sm gap-2 hover:text-primary">
								View All
								<ArrowRight size={16} />
							</Link>
						</div>

						<div className="space-y-3">
							{stats.recentExpenses.length === 0 ? (
								<p className="text-center text-base-content/60 py-8">No expenses yet</p>
							) : (
								stats.recentExpenses.map((expense) => (
									<div key={expense._id} className="flex items-center justify-between p-4 bg-base-200 rounded-xl hover:shadow-md transition-all cursor-pointer">
										<div className="flex items-center gap-3">
											<div className="bg-primary/10 p-2 rounded-lg">
												<Wallet size={20} className="text-primary" />
											</div>
											<div>
												<p className="font-semibold">{expense.category}</p>
												<p className="text-xs text-base-content/60">
													{new Date(expense.date).toLocaleDateString()} • {expense.note || 'No note'}
												</p>
											</div>
										</div>
										<span className="text-lg font-bold text-primary">₹{expense.amount}</span>
									</div>
								))
							)}
						</div>
					</div>
				</div>

				<div className="card bg-base-100 shadow-xl card-hover border border-base-300">
					<div className="card-body">
						<div className="flex items-center justify-between mb-4">
							<h2 className="card-title flex items-center gap-2">
								<Target size={24} />
								Top Categories
							</h2>
						</div>

						<div className="space-y-4">
							{topCategories.length === 0 ? (
								<p className="text-center text-base-content/60 py-8">No spending data this month</p>
							) : (
								topCategories.map(([category, amount], index) => {
									const percentage = (amount / stats.thisMonth) * 100;
									return (
										<div key={category} className="space-y-2">
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-2">
													<div
														className="w-3 h-3 rounded-full"
														style={{ backgroundColor: COLORS[index % COLORS.length] }}
													/>
													<span className="font-medium">{category}</span>
												</div>
												<span className="text-sm font-bold">₹{amount.toFixed(2)}</span>
											</div>
											<div className="flex items-center gap-2">
												<progress
													className="progress progress-primary w-full h-2"
													value={percentage}
													max="100"
													style={{
														'--progress-color': COLORS[index % COLORS.length]
													}}
												></progress>
												<span className="text-xs text-base-content/60 min-w-[45px] text-right">
													{percentage.toFixed(1)}%
												</span>
											</div>
										</div>
									);
								})
							)}
						</div>

						<Link to="/expense-history" className="btn btn-outline btn-primary mt-4 w-full">
							View Detailed Analytics
						</Link>
					</div>
				</div>
			</div>

			{/* Quick Actions */}
			<div className="card bg-base-100 shadow-xl">
				<div className="card-body">
					<h2 className="card-title mb-4">Quick Actions</h2>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						<Link to="/expenses" className="btn btn-outline gap-2">
							<Wallet size={20} />
							Add Expense
						</Link>
						<Link to="/expense-history" className="btn btn-outline gap-2">
							<PieChart size={20} />
							View History
						</Link>
						<Link to="/predict" className="btn btn-outline gap-2">
							<TrendingUp size={20} />
							Predictions
						</Link>
						<Link to="/profile" className="btn btn-outline gap-2">
							<Calendar size={20} />
							Set Budget
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}