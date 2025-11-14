import React, { useState, useEffect } from "react";

const categories = [
	'Food & Drink', 'Travel', 'Utilities', 'Entertainment',
	'Health & Fitness', 'Shopping', 'Rent', 'Other', 'Salary',
	'Investment', 'Clothing', 'Education', 'Personal Care'
];

export default function ExpenseForm({ onSubmit, initial = {}, submitting = false }) {
	const [amount, setAmount] = useState(Number(initial.amount));
	const [category, setCategory] = useState(initial.category || categories[0]);
	const [date, setDate] = useState(
		initial.date
			? new Date(initial.date).toISOString().slice(0, 10)
			: new Date().toISOString().slice(0, 10)
	);
	const [note, setNote] = useState(initial.description || initial.note || "");

	// Only update when editing an existing expense (when initial._id changes)
	useEffect(() => {
		if (initial._id) {
			setAmount(Number(initial.amount));
			setCategory(initial.category || categories[0]);
			setDate(
				initial.date
					? new Date(initial.date).toISOString().slice(0, 10)
					: new Date().toISOString().slice(0, 10)
			);
			setNote(initial.description || initial.note || "");
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [initial._id]);

	function submit(event) {
		event.preventDefault();
		onSubmit({
			amount: Number(amount),
			category,
			date,
			note
		});
	}

	return (
		<div className='container mx-auto px-4 py-8'>
			<form onSubmit={submit} className="space-y-6">
				{/* Amount */}
				<div className="form-control w-full">
					<label className="label">
						<span className="label-text font-semibold">Amount (₹)</span>
					</label>
					<input
						required
						type="number"
						step="0.01"
						min="0"
						placeholder="Enter amount"
						value={amount}
						onChange={(e) => {
							const value = e.target.value;
							// Only allow valid numbers or empty string
							if (value === '' || !isNaN(value)) {
								setAmount(value);
							}
						}}
						onKeyUp={(e) => {
							// Prevent non-numeric characters except decimal point
							if (!/[0-9.]/.test(e.key)) {
								e.preventDefault();
							}
						}}
						className="input input-bordered w-full bg-base-200"
					/>
				</div>

				{/* Category */}
				<div className="form-control w-full">
					<label className="label">
						<span className="label-text font-semibold">Category</span>
					</label>
					<select
						value={category}
						onChange={(e) => setCategory(e.target.value)}
						className="select select-bordered w-full bg-base-200"
					>
						{categories.map((c) => (
							<option key={c} value={c}>
								{c}
							</option>
						))}
					</select>
				</div>

				{/* Date */}
				<div className="form-control w-full">
					<label className="label">
						<span className="label-text font-semibold">Date</span>
					</label>
					<input
						type="date"
						value={date}
						onChange={(e) => setDate(e.target.value)}
						className="input input-bordered w-full bg-base-200"
					/>
				</div>

				{/* Note */}
				<div className="form-control w-full">
					<label className="label">
						<span className="label-text font-semibold">Note (optional)</span>
					</label>
					<input
						type="text"
						placeholder="Add a note about this expense"
						value={note}
						onChange={(e) => setNote(e.target.value)}
						className="input input-bordered w-full bg-base-200"
					/>
				</div>

				{/* Submit Button */}
				<div className="form-control pt-4">
					<button type="submit" className="btn btn-primary w-full" disabled={!amount || submitting}>
						{submitting ? 'Saving...' : 'Save Expense'}
					</button>
				</div>
			</form>
		</div>
	);
}