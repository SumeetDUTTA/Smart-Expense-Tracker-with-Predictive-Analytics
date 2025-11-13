import React, {useState, useEffect} from "react";
import api from "../api";
import ExpenseForm from "../components/expenseForm";
import FAB from "../components/FAB";

export default function Expenses(){
		const [list, setList] = useState([]);
		const [loading, setLoading] = useState(false);
		const [editing, setEditing] = useState(null);
		const [showAdd, setShowAdd] = useState(false);
		const [error, setError] = useState(null);

		async function fetchExpense() {
				setLoading(true);
				try {
						const res = await api.get("/expenses");
						setList(res.data);
				} catch (error) {
						console.error(error);
						setError("Failed to fetch expenses");
				} finally {
						setLoading(false);
				}
		}

		useEffect(() => { fetchExpense()}, [])

		async function create(payload) {
				try {
						await api.post("/expenses", payload);
						fetchExpense();
						setShowAdd(false);
				} catch (error) {
						console.error(error);
						setError("Failed to create expense");
				}
		}
		async function update(id, payload) {
				try {
						await api.put(`/expenses/${id}`, payload);
						setEditing(null);
						fetchExpense();
				} catch (error) {
						console.error(error);
						setError("Failed to update expense");
				}
		}
		async function remove(id) {
				if (!window.confirm("Are you sure you want to delete this expense?")) return;
				try {
						await api.delete(`/expenses/${id}`);
						fetchExpense();
				} catch (error) {
						console.error(error);
						setError("Failed to delete expense");
				}
		}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-semibold">Your expenses</h2>
				<div className="text-sm text-gray-500">Manage and track your spending</div>
			</div>

			<div className="grid md:grid-cols-3 gap-4">
				<div className="md:col-span-2 space-y-4">
					<div className="bg-white p-4 rounded-2xl shadow-sm min-h-[200px]">
						<div className="text-sm text-gray-500 mb-2">Recent expenses</div>
						{loading ? <div>Loading…</div> : (
							<div className="divide-y">
								{list.length === 0 && <div className="text-gray-500 p-4">No expenses yet — click the + button to add.</div>}
								{list.map(item => (
									<div key={item._id} className="flex items-center justify-between py-3">
										<div>
											<div className="font-medium">{item.category}</div>
											<div className="text-xs text-gray-500">{new Date(item.date).toLocaleDateString()} · {item.note}</div>
										</div>
										<div className="text-right">
											<div className="font-semibold">₹{item.amount}</div>
											<div className="text-xs space-x-2 mt-1">
												<button onClick={() => setEditing(item)} className="text-indigo-600 text-xs">Edit</button>
												<button onClick={() => remove(item._id)} className="text-red-600 text-xs">Delete</button>
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</div>

				<div className="space-y-4">
					<div className="bg-white p-4 rounded-2xl shadow-sm">
						<div className="text-sm text-gray-500">Summary</div>
						<div className="mt-3">
							<div className="text-xl font-bold">₹{list.reduce((s, x) => s + (Number(x.amount) || 0), 0)}</div>
							<div className="text-xs text-gray-500">Total this period</div>
						</div>
					</div>

					<div className="bg-white p-4 rounded-2xl shadow-sm">
						<div className="text-sm text-gray-500">Quick actions</div>
						<div className="mt-3 flex gap-2">
							<button onClick={() => setShowAdd(true)} className="px-3 py-1 bg-indigo-600 text-white rounded">Add expense</button>
							<button onClick={fetchExpense} className="px-3 py-1 border rounded">Refresh</button>
						</div>
					</div>
				</div>
			</div>

			{/* Editing inline */}
			{editing && (
				<div className="bg-white p-4 rounded shadow">
					<h3 className="text-lg mb-2">Edit Expense</h3>
					<ExpenseForm initial={editing} onSubmit={(p) => update(editing._id, p)} />
					<div className="mt-2"><button onClick={() => setEditing(null)} className="text-sm">Cancel</button></div>
				</div>
			)}

			{/* Add modal area (simple slide-over) */}
			{showAdd && (
				<div className="fixed inset-0 z-40 flex items-end md:items-center justify-center">
					<div className="absolute inset-0 bg-black/40" onClick={() => setShowAdd(false)} />
					<div className="relative bg-white rounded-2xl shadow-lg p-6 w-full max-w-xl m-4">
						<div className="flex items-center justify-between mb-3">
							<h3 className="text-lg font-medium">Add expense</h3>
							<button onClick={() => setShowAdd(false)} className="text-gray-600">Close</button>
						</div>
						<ExpenseForm onSubmit={create} />
					</div>
				</div>
			)}

			<FAB onClick={() => setShowAdd(true)} />
		</div>
	)
}