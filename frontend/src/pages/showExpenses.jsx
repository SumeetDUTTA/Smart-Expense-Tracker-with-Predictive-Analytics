import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Brush } from 'recharts'
import toast from 'react-hot-toast'

import api from '../lib/api'
import ExpenseForm from '../components/expenseForm'

/* ---------- Helpers (same as ExpenseHistory) ---------- */
function parseDate(s) {
  const d = s ? new Date(s) : new Date()
  if (Number.isNaN(d.getTime())) return null
  return d
}
function formatMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}
function formatDayKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
function getWeekKey(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}
function keyToLabel(key, agg) {
  if (!key) return ''
  if (agg === 'monthly') {
    const [y, m] = key.split('-')
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${monthNames[Number(m) - 1]} ${y}`
  }
  if (agg === 'weekly') {
    return key.replace('-', ' ')
  }
  return key
}
function clampDate(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}
function subMonths(date, months) {
  const d = new Date(date)
  d.setMonth(d.getMonth() - months)
  return d
}

/* ---------- Component ---------- */
export default function ShowExpenses() {
  // CRUD state
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(null)

  // search/filter state
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')

  // analytics controls
  const [analyticsOpen, setAnalyticsOpen] = useState(false)
  const [preset, setPreset] = useState('3M')
  const [agg, setAgg] = useState('monthly') // daily|weekly|monthly
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const navigate = useNavigate()

  // fetch expenses
  async function fetchExpenses() {
    setLoading(true)
    try {
      const res = await api.get('/expenses')
      // handle different backend shapes
      const data = Array.isArray(res.data) ? res.data : (res.data?.expenses && Array.isArray(res.data.expenses) ? res.data.expenses : [])
      setList(data)
    } catch (err) {
      console.error('Failed to fetch expenses', err)
      toast.error?.('Failed to load expenses')
      setList([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchExpenses() }, [])

  /* ---------- CRUD handlers ---------- */

  async function update(id, payload) {
    try {
      await api.patch(`/expenses/${id}`, payload)
      toast.success?.('Expense updated')
      setEditing(null)
      fetchExpenses()
    } catch (err) {
      console.error(err)
      toast.error?.(err?.response?.data?.message || 'Failed to update')
    }
  }

  async function remove(id) {
    if (!confirm('Delete this expense?')) return
    try {
      await api.delete(`/expenses/${id}`)
      toast.success?.('Expense deleted')
      fetchExpenses()
    } catch (err) {
      console.error(err)
      toast.error?.(err?.response?.data?.message || 'Failed to delete')
    }
  }

  /* ---------- Filtering for list display (search + category) ---------- */
  const filteredList = useMemo(() => {
    const base = Array.isArray(list) ? list : []
    return base.filter(it => {
      if (categoryFilter !== 'All' && it.category !== categoryFilter) return false
      if (!search) return true
      const s = search.toLowerCase()
      return (String(it.category || '').toLowerCase().includes(s) ||
        String(it.note || '').toLowerCase().includes(s) ||
        String(it.amount || '').toLowerCase().includes(s))
    })
  }, [list, search, categoryFilter])

  /* ---------- Analytics: compute start/end based on preset/custom ---------- */
  const { startDate, endDate } = useMemo(() => {
    const now = new Date()
    let end = customEnd ? parseDate(customEnd) : now
    if (!end) end = now
    end.setHours(23, 59, 59, 999)

    let start = null
    if (customStart) start = parseDate(customStart)
    else {
      switch (preset) {
        case '1M': start = subMonths(now, 1); break
        case '3M': start = subMonths(now, 3); break
        case '6M': start = subMonths(now, 6); break
        case '1Y': start = subMonths(now, 12); break
        case 'All':
        default:
          {
            const dates = list.map(e => parseDate(e.date)).filter(Boolean)
            start = dates.length ? new Date(Math.min(...dates.map(d => d.getTime()))) : subMonths(now, 12)
          }
      }
    }
    if (!start) start = subMonths(now, 3)
    start = clampDate(start)
    return { startDate: start, endDate: end }
  }, [preset, customStart, customEnd, list])

  /* ---------- Analytics grouping ---------- */
  const grouped = useMemo(() => {
    const base = Array.isArray(list) ? list : []
    const filtered = base
      .map(it => ({ ...it, parsedDate: parseDate(it.date) }))
      .filter(it => it.parsedDate)
      .filter(it => {
        const t = it.parsedDate.getTime()
        return t >= startDate.getTime() && t <= endDate.getTime()
      })

    const map = new Map()
    filtered.forEach(it => {
      const dt = it.parsedDate
      let key
      if (agg === 'monthly') key = formatMonthKey(dt)
      else if (agg === 'weekly') key = getWeekKey(dt)
      else key = formatDayKey(dt)
      const prev = map.get(key) || 0
      map.set(key, prev + (Number(it.amount) || 0))
    })

    const keys = Array.from(map.keys()).sort((a, b) => {
      if (agg === 'monthly') {
        const [ay, am] = a.split('-').map(Number); const [by, bm] = b.split('-').map(Number)
        if (ay !== by) return ay - by; return am - bm
      }
      if (agg === 'weekly') {
        const [ay, aw] = a.split('-W').map(Number); const [by, bw] = b.split('-W').map(Number)
        if (ay !== by) return ay - by; return aw - bw
      }
      return new Date(a) - new Date(b)
    })

    const data = keys.map(k => ({ name: keyToLabel(k, agg), value: map.get(k) || 0, rawKey: k }))
    return { data, filtered }
  }, [list, startDate, endDate, agg])

  const chartData = Array.isArray(grouped.data) ? grouped.data : []
  const totalInRange = chartData.reduce((s, r) => s + (Number(r.value) || 0), 0)
  const periodsCount = chartData.length || 1
  const avgPerPeriod = Math.round(totalInRange / periodsCount || 0)

  /* ---------- category options for filter dropdown ---------- */
  const categories = useMemo(() => {
    const cats = Array.from(new Set(list.map(i => i.category).filter(Boolean)))
    return ['All', ...cats]
  }, [list])

  /* ---------- UI ---------- */
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Expenses</h2>
        <div className="flex items-center gap-2">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search category, note, amount" className="p-2 border rounded w-64" />
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="p-2 border rounded">
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={() => navigate('/add-expense')} className="px-3 py-1 bg-indigo-600 text-white rounded">Add Expense</button>
        </div>
      </div>

      {/* Analytics panel (toggleable) */}
      <div className="bg-white p-4 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm text-gray-500">SpendPulse — expense history</div>
            <div className="text-lg font-semibold">Analyze your spending</div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setAnalyticsOpen(a => !a)} className="px-3 py-1 border rounded">
              {analyticsOpen ? 'Hide analytics' : 'Show analytics'}
            </button>
            <div className="text-sm text-gray-500">Range & aggregation</div>
          </div>
        </div>

        {analyticsOpen && (
          <>
            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-3 items-start md:items-center mb-4">
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => { setPreset('1M'); setCustomStart(''); setCustomEnd('') }} className={`px-3 py-1 rounded ${preset === '1M' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>1M</button>
                <button onClick={() => { setPreset('3M'); setCustomStart(''); setCustomEnd('') }} className={`px-3 py-1 rounded ${preset === '3M' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>3M</button>
                <button onClick={() => { setPreset('6M'); setCustomStart(''); setCustomEnd('') }} className={`px-3 py-1 rounded ${preset === '6M' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>6M</button>
                <button onClick={() => { setPreset('1Y'); setCustomStart(''); setCustomEnd('') }} className={`px-3 py-1 rounded ${preset === '1Y' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>1Y</button>
                <button onClick={() => { setPreset('All'); setCustomStart(''); setCustomEnd('') }} className={`px-3 py-1 rounded ${preset === 'All' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>All</button>
              </div>

              <div className="ml-auto flex items-center gap-2">
                <label className="text-sm text-gray-600">Aggregation</label>
                <select value={agg} onChange={e => setAgg(e.target.value)} className="p-1 border rounded">
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Custom range</label>
                <input type="date" value={customStart} onChange={e => { setCustomStart(e.target.value); setPreset('') }} className="p-1 border rounded" />
                <input type="date" value={customEnd} onChange={e => { setCustomEnd(e.target.value); setPreset('') }} className="p-1 border rounded" />
                <button onClick={() => { setCustomStart(''); setCustomEnd(''); setPreset('3M') }} className="px-2 py-1 bg-gray-100 rounded">Reset</button>
              </div>
            </div>

            {/* Chart + summary */}
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="bg-white p-4 rounded-2xl shadow-sm mb-4">
                  <div className="text-sm text-gray-500">Total in range</div>
                  <div className="text-2xl font-bold mt-1">₹{totalInRange}</div>
                  <div className="text-xs text-gray-500 mt-1">Avg per {agg === 'daily' ? 'day' : agg === 'weekly' ? 'week' : 'month'}: ₹{avgPerPeriod}</div>
                </div>

                <div style={{ width: '100%', height: 260, minWidth: 0 }} className="bg-white p-4 rounded-2xl shadow-sm">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(v) => `₹${v}`} />
                        <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} dot />
                        <Brush dataKey="name" height={30} stroke="#8884d8" />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">No data for chosen range</div>
                  )}
                </div>
              </div>

              <div className="w-full lg:w-80 space-y-4">
                <div className="bg-white p-4 rounded-2xl shadow-sm">
                  <div className="text-sm text-gray-500">Period breakdown</div>
                  {chartData.length === 0 ? <div className="text-gray-500 mt-2">No data</div> : (
                    <div className="overflow-auto mt-2" style={{ maxHeight: 200 }}>
                      <table className="w-full text-left">
                        <thead className="bg-gray-100"><tr><th className="p-2">Period</th><th className="p-2">Total</th></tr></thead>
                        <tbody>
                          {chartData.map(row => (
                            <tr key={row.name} className="border-t">
                              <td className="p-2">{row.name}</td>
                              <td className="p-2">₹{row.value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-sm">
                  <div className="text-sm text-gray-500">Recent in range</div>
                  {grouped.filtered.length === 0 ? <div className="text-gray-500 mt-2">No expenses</div> : (
                    <div className="divide-y mt-2">
                      {grouped.filtered.slice().sort((a, b) => b.parsedDate - a.parsedDate).slice(0, 8).map(it => (
                        <div key={it._id || (it.parsedDate && it.parsedDate.getTime())} className="py-2 flex justify-between">
                          <div>
                            <div className="font-medium">{it.category}</div>
                            <div className="text-xs text-gray-500">{it.parsedDate.toLocaleDateString()} · {it.note}</div>
                          </div>
                          <div className="text-right">₹{it.amount}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Existing table / list area */}
      <div className="bg-white p-4 rounded-2xl shadow-sm">
        <div className="text-sm text-gray-500 mb-2">All expenses</div>
        {loading ? <div>Loading…</div> : (
          <>
            {filteredList.length === 0 ? (
              <div className="text-gray-500 p-4">No expenses found. Add your first expense.</div>
            ) : (
              <div className="overflow-auto">
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
                    {filteredList.map(item => (
                      <tr key={item._id} className="border-t">
                        <td className="p-2">{new Date(item.date).toLocaleDateString()}</td>
                        <td className="p-2">{item.category}</td>
                        <td className="p-2">₹{item.amount}</td>
                        <td className="p-2">{item.note}</td>
                        <td className="p-2 space-x-2">
                          <button onClick={() => setEditing(item)} className="text-indigo-600 text-sm">Edit</button>
                          <button onClick={() => remove(item._id)} className="text-red-600 text-sm">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-40 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditing(null)} />
          <div className="relative bg-white rounded-2xl shadow-lg p-6 w-full max-w-xl m-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium">Edit expense</h3>
              <button onClick={() => setEditing(null)} className="text-gray-600">Close</button>
            </div>
            <ExpenseForm initial={editing} onSubmit={(p) => update(editing._id, p)} />
          </div>
        </div>
      )}
      <div className="fixed bottom-6 right-6 z-50">
        <button onClick={() => navigate('/add-expense')} aria-label="Add expense" className="bg-indigo-600 text-white p-3 rounded-full shadow-lg text-xl">+</button>
      </div>
    </div>
  )
}