/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from "react";

const categories = [
    'Food & Drink', 'Travel', 'Utilities', 'Entertainment',
    'Health & Fitness', 'Shopping', 'Rent', 'Other', 'Salary',
    'Investment', 'Clothing', 'Education', 'Personal Care'
];

export default function ExpenseForm({ onSubmit, initial = {} }) {
    const [amount, setAmount] = useState(initial.amount || "");
    const [category, setCategory] = useState(initial.category || categories[0]);
    const [date, setDate] = useState(
        initial.date
            ? new Date(initial.date).toISOString().slice(0, 10)
            : new Date().toISOString().slice(0, 10)
    );
    const [note, setNote] = useState(initial.description || initial.note || "");

    useEffect(() => {
        setAmount(initial.amount || "");
        setCategory(initial.category || categories[0]);
        setDate(
            initial.date
                ? new Date(initial.date).toISOString().slice(0, 10)
                : new Date().toISOString().slice(0, 10)
        );
        setNote(initial.description || initial.note || "");
    }, [initial]);

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
        <form onSubmit={submit} className="space-y-4">
            {/* Amount */}
            <div className="w-full">
                <label className="block text-sm font-medium mb-2">
                    Amount
                </label>
                <input
                    required
                    type="number"
                    step="0.01"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="input input-bordered w-full"
                />
            </div>

            {/* Category */}
            <div className="w-full">
                <label className="block text-sm font-medium mb-2">
                    Category
                </label>
                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="select select-bordered w-full"
                >
                    {categories.map((c) => (
                        <option key={c} value={c}>
                            {c}
                        </option>
                    ))}
                </select>
            </div>

            {/* Date */}
            <div className="w-full">
                <label className="block text-sm font-medium mb-2">
                    Date
                </label>
                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="input input-bordered w-full"
                />
            </div>

            {/* Note */}
            <div className="w-full">
                <label className="block text-sm font-medium mb-2">
                    Note (optional)
                </label>
                <input
                    type="text"
                    placeholder="Add a note about this expense"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="input input-bordered w-full"
                />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-2 pt-2">
                <button type="submit" className="btn btn-primary">
                    Save Expense
                </button>
            </div>
        </form>
    );
}