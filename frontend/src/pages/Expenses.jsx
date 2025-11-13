import React, {useState, useEffect} from "react";
import api from "../api";
import ExpenseForm from "../components/expenseForm";

export default function Expenses(){
		const [list, setList] = useState([]);
		const [loading, setLoading] = useState(false);
		const [editing, setEditing] = useState(null);
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
				try {
						await api.delete(`/expenses/${id}`);
						fetchExpense();
				} catch (error) {
						console.error(error);
						setError("Failed to delete expense");
				}
		}

		return (
				<div className="space-y-4">
						<h2 className="text-xl font-semibold">Expenses</h2>
						<ExpenseForm onSubmit={create} />
						{loading ? <div>Loading…</div> : (
								<div className="bg-white rounded shadow overflow-hidden">
										<table className="w-full text-left">
												<thead className="bg-gray-100">
														<tr>
																<th className="p-2">Date</th>
																<th className="p-2">Category</th>
																<th className="p-2">Amount</th>
																<th className="p-2">Note</th>
																<th className="p-2">Actions</th>
														</tr>
												</thead>
												<tbody>
														{list.map(item => (
																<tr key={item._id} className="border-t">
																		<td className="p-2">{new Date(item.date).toLocaleDateString()}</td>
																		<td className="p-2">{item.category}</td>
																		<td className="p-2">₹{item.amount}</td>
																		<td className="p-2">{item.note}</td>
																		<td className="p-2 space-x-2">
																				<button onClick={() => setEditing(item)} className="text-sm text-blue-600">Edit</button>
																				<button onClick={() => remove(item._id)} className="text-sm text-red-600">Delete</button>
																		</td>
																</tr>
														))}
												</tbody>
										</table>
								</div>
						)}

						{editing && (
								<div>
										<h3 className="text-lg font-medium">Edit Expense</h3>
										<ExpenseForm initial={editing} onSubmit={(p) => update(editing._id, p)} />
										<div className="mt-2">
												<button onClick={() => setEditing(null)} className="text-sm">Cancel</button>
										</div>
								</div>
						)}
				</div>
		)    
}