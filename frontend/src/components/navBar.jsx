/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable no-unused-vars */
import React, { useState, useRef, useEffect } from "react";
import { NavLink, Link,useLocation } from "react-router-dom";
import { Home, Wallet, TrendingUp, User, LogOut, Plus, ChevronDown } from "lucide-react";

import { useAuth } from "../contexts/authContext.jsx";
import "../styles/NavBar.css";

export default function NavBar() {
	const { token, user, logout } = useAuth();
	const location = useLocation();
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const dropdownRef = useRef(null);

	// Close mobile dropdown on route change
	useEffect(() => {
		setIsDropdownOpen(false);
	}, [location.pathname]);

	// Close on outside click / Esc key
	useEffect(() => {
		function handleClickOutside(e) {
			if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
				setIsDropdownOpen(false);
			}
		}
		function handleEsc(e) {
			if (e.key === "Escape") setIsDropdownOpen(false);
		}
		document.addEventListener("mousedown", handleClickOutside);
		document.addEventListener("keydown", handleEsc);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
			document.removeEventListener("keydown", handleEsc);
		};
	}, []);

	return (
		<nav>
			<Link className="title" to="/">ExpenseKeeper</Link>
			<div className="menu" onClick={() => {
				setIsDropdownOpen(!isDropdownOpen);
			}}>
				<span></span>
				<span></span>
				<span></span>
			</div>
			<ul className={isDropdownOpen ? "open" : ""}>
				{token ? (
					<>
						<li>
							
							<NavLink to="/"><Home />Dashboard</NavLink>
						</li>
						<li>
							
							<NavLink to="/expenses" ><Wallet />Expenses</NavLink>
						</li>
						<li>
							
							<NavLink to="/add-expense" ><Plus />Add Expense</NavLink>
						</li>
						<li>
							
							<NavLink to="/predict" ><TrendingUp />Predict</NavLink>
						</li>
						<li>
							
							<NavLink to="/profile" ><User />Profile</NavLink>
						</li>
						<li>
							<button className="logout-btn" onClick={logout}><LogOut /></button>
						</li>
					</>
				) : (
					<>
					</>
				)
				}
			</ul>
		</nav>
	)
}