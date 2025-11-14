// src/pages/addExpenses.jsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import ExpenseForm from '../components/expenseForm'
import toast from 'react-hot-toast'

export default function AddExpense() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)

  async function handleCreate(payload) {
    setSubmitting(true)
    try {
      await api.post('/expenses', payload)
      toast.success?.('Expense added')
      // return to list (you can also route to newly created item's detail if you have one)
      navigate('/expenses')
    } catch (err) {
      console.error('Failed to add expense', err)
      toast.error?.(err?.response?.data?.message || 'Failed to add expense')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-4">
        <h2 className="text-2xl font-semibold">Add Expense</h2>
        <p className="text-sm text-gray-500">Add a new expense — it will appear in your list and analytics.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm">
        <ExpenseForm onSubmit={handleCreate} submitting={submitting} />
      </div>

      <div className="mt-4">
        <button onClick={()=>navigate('/expenses')} className="px-3 py-1 border rounded">Back to expenses</button>
      </div>
    </div>
  )
}
