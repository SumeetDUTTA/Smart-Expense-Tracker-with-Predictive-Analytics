// src/pages/addExpenses.jsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
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
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-primary">Add Expense</h2>
          <p className="text-base-content/60 mt-1">Add a new expense — it will appear in your list and analytics.</p>
        </div>
        <button onClick={() => navigate('/expenses')} className="btn btn-ghost btn-sm">
          ← Back
        </button>
      </div>

      <div className="card bg-base-100 shadow-xl border border-base-300">
        <div className="card-body">
          <ExpenseForm onSubmit={handleCreate} submitting={submitting} />
        </div>
      </div>
    </div>
  )
}
