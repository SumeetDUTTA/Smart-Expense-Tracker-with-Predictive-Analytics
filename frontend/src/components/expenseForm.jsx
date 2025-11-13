import React, {useState, useEffect} from "react";

const categories = [
    'Food & Drink','Travel','Utilities',
    'Entertainment','Health & Fitness',
    'Shopping','Rent','Other','Salary',
    'Investment','Clothing','Education','Personal Care'
]

export default function ExpenseForm({onSubmit, initial={} }){
    const [amount, setAmount] = useState(initial.amount || "");
        const [category, setCategory] = useState(initial.category || categories[0]);

    const [date, setDate] = useState(initial.date ? new Date(initial.date).toISOString().slice(0,10) : new Date().toISOString().slice(0,10));
    const [note, setNote] = useState(initial.description || "");

    useEffect(() => {
        setAmount(initial.amount || "");
        setCategory(initial.category || categories[0]);
        setDate(initial.date ? new Date(initial.date).toISOString().slice(0,10) : new Date().toISOString().slice(0,10));
        setNote(initial.description || "");
    }, [initial])

    function submit(event){
        event.preventDefault();
        onSubmit({
            amount: Number(amount),
            category,
            date,
            note
        });
    }

    return (
        <form onSubmit={submit} className="space-y-2 bg-white p-4 rounded shadow">
            <div className="grid grid-cols-2 gap-2">
                <input required type="number" step="0.01" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} className="p-2 border rounded" />
                <select value={category} onChange={e => setCategory(e.target.value)} className="p-2 border rounded">
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="p-2 border rounded" />
                <input type="text" placeholder="Note (optional)" value={note} onChange={e => setNote(e.target.value)} className="p-2 border rounded" />
            </div>
            <div className="text-right">
                <button className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
            </div>
        </form> 
    )
}