import React from "react";
import { Routes, Route, Link, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Expenses from "./pages/Expenses";
import Predict from "./pages/Predict";
import Profile from "./pages/Profile";
import { useAuth } from "./contexts/authContext.jsx";

function Private({ children }){
  const {token} = useAuth();
  return token ? children : <Navigate to="/login" />
}

export default function App() {
  const {logout, user} = useAuth();
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold">Expense Tracker and Predictor</h1>
          <nav className="space-x-4">
            <Link to='/login' className="hover:underline">Login</Link>
            <Link to='/expenses' className="hover:underline">Expenses</Link>
            <Link to="/predict" className="hover:underline">Predict</Link>
            <Link to='/profile' className="hover:underline">Profile</Link>
            {user ? (
              <button onClick={logout} className="ml-2 text-sm text-red-600">Logout</button>
            ) : (
              <Link to='/login' className="ml-2">Login</Link>
            )}
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-4">
        <Routes>
          <Route path='/' element={<div>Welcome to the Expense Tracker and Predictor</div>} />
          <Route path='/login' element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path='/expenses' element={<Private><Expenses /></Private>} />
          <Route path='/predict' element={<Private><Predict /></Private>} />
          <Route path='/profile' element={<Private><Profile /></Private>} />
        </Routes>
      </main>
    </div>
  )
}