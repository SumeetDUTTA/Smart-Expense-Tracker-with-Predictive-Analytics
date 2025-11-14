/* eslint-disable no-unused-vars */
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Wallet, TrendingUp, BarChart3, User, LogOut, LogIn, UserPlus, Plus } from "lucide-react";

import { useAuth } from "../contexts/authContext.jsx";

export default function NavBar() {
	const { token, user, logout } = useAuth();
	const location = useLocation();

	const isActive = (path) => location.pathname === path;

	const navLinks = [
		{ path: "/", icon: Home, label: "Dashboard" },
		{ path: "/expenses", icon: Wallet, label: "Expenses" },
		{path: "/add-expense", icon: Plus, label: "Add Expense"},
		{ path: "/predict", icon: TrendingUp, label: "Predict" },
		{path: "/profile", icon: User, label: "Profile"},
	];

	return (
		<header className="border-b border-base-content/10">
			<div className="mx-auto max-w-6xl p-4">
				<div className="flex items-center justify-between">
					{/* Branding */}
					<h1 className="text-3xl font-bold text-primary font-mono tracking-tight">
						ExpenseKeeper
					</h1>

					{/* Navigation Links - Desktop */}
					{token && (
						<nav className="hidden md:flex items-center gap-2">
							{navLinks.map((link) => {
								const Icon = link.icon;
								return (
									<Link
										key={link.path}
										to={link.path}
										className={`flex items-center gap-2 px-3 py-2 rounded-md transition ${isActive(link.path)
											? "bg-primary text-primary-content"
											: "hover:bg-base-200"
											}`}
									>
										<Icon className="size-5" />
										<span>{link.label}</span>
									</Link>
								);
							})}
						</nav>
					)}

					{/* Right side actions */}
					<div className="flex items-center gap-4">
						{token ? (
							<>
								<Link to="/add-expense" className="btn btn-primary flex items-center gap-1">
									<Plus className="size-5" />
									<span>New Expense</span>
								</Link>
								<button onClick={logout} className="btn btn-ghost">
									<LogOut size={18} />
									<span className="hidden sm:inline">Logout</span>
								</button>
							</>
						) : (
							<>
								<Link to="/expenses" className="btn btn-primary">
									<Plus className="size-5" />
									<span>New Expense</span>
								</Link>
								<Link to="/register" className="btn btn-primary">
									<UserPlus size={18} />
									<span className="hidden sm:inline">Register</span>
								</Link>
								<Link to="/login" className="btn btn-primary">
									<LogIn size={18} />
									<span className="hidden sm:inline">Login</span>
								</Link>
							</>
						)}
					</div>
				</div>

				{/* Navigation Links - Mobile Dropdown */}
				{token && (
					<div className="md:hidden mt-4">
						<div className="dropdown w-full">
							<label tabIndex={0} className="btn btn-outline w-full">
								<span>Navigation Menu</span>
								<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
								</svg>
							</label>
							<ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-full mt-2">
								{navLinks.map((link) => {
									const Icon = link.icon;
									return (
										<li key={link.path}>
											<Link
												to={link.path}
												className={`flex items-center gap-2 ${isActive(link.path) ? "active" : ""
													}`}
											>
												<Icon className="size-5" />
												<span>{link.label}</span>
											</Link>
										</li>
									);
								})}
							</ul>
						</div>
					</div>
				)}
			</div>
		</header>
	);
}