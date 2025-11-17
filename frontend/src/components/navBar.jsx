/* eslint-disable react-hooks/set-state-in-effect */
/* src/components/navBar.jsx */
import React, { useState, useRef, useEffect } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import {
	Home,
	Wallet,
	TrendingUp,
	User,
	LogOut,
	Plus,
	Menu,
	SunMoon
} from "lucide-react";

import { useAuth } from "../contexts/authContext.jsx";
import "../styles/NavBar.css";

export default function NavBar() {
	const { token, logout } = useAuth();
	const location = useLocation();
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef(null);

	// Close mobile menu on route change
	useEffect(() => setIsOpen(false), [location.pathname]);

	// Close on outside click / Esc
	useEffect(() => {
		function handleOutside(e) {
			if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
		}
		function handleEsc(e) {
			if (e.key === "Escape") setIsOpen(false);
		}
		document.addEventListener("mousedown", handleOutside);
		document.addEventListener("keydown", handleEsc);
		return () => {
			document.removeEventListener("mousedown", handleOutside);
			document.removeEventListener("keydown", handleEsc);
		};
	}, []);

	return (
		<header className="site-nav">
			<div className="nav-inner">
				<div className="brand-row">
					<Link to="/" className="brand">
						<span className="brand-mark">EK</span>
						<span className="brand-name">ExpenseKeeper</span>
					</Link>

					{token && (
						<button
							className={`mobile-toggle${isOpen ? " open" : ""}`}
							aria-label={isOpen ? "Close menu" : "Open menu"}
							aria-expanded={isOpen}
							onClick={() => setIsOpen(v => !v)}
						>
							<span className="sr-only">{isOpen ? "Close menu" : "Open menu"}</span>
							<Menu size={18} />
						</button>
					)}
				</div>

				<nav
					ref={dropdownRef}
					className={`nav-links${isOpen ? " open" : ""}`}
					aria-label="Main navigation"
				>
					{token ? (
						<>
							<NavItem to="/" exact onClick={() => setIsOpen(false)}>
								<Home /> <span>Dashboard</span>
							</NavItem>

							<NavItem to="/expenses" onClick={() => setIsOpen(false)}>
								<Wallet /> <span>Expenses</span>
							</NavItem>

							<NavItem to="/add-expense" onClick={() => setIsOpen(false)}>
								<Plus /> <span>Add</span>
							</NavItem>

							<NavItem to="/predict" onClick={() => setIsOpen(false)}>
								<TrendingUp /> <span>Predict</span>
							</NavItem>

							<NavItem to="/profile" onClick={() => setIsOpen(false)}>
								<User /> <span>Profile</span>
							</NavItem>

							<div className="nav-spacer" />

							<div className="nav-actions">
								<button
									className="logout"
									onClick={() => { logout(); setIsOpen(false); }}
									title="Log out"
								>
									<LogOut />
									<span className="hide-xs">Logout</span>
								</button>
							</div>
						</>
					) : (
						<>
						</>
					)}
				</nav>
			</div>
		</header>
	);
}

/* NavItem helper component - keeps NavLink markup consistent */
function NavItem({ to, exact, children, onClick }) {
	// exact prop is optional
	return (
		<li className="nav-item" onClick={onClick}>
			<NavLink
				to={to}
				end={exact}
				className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
			>
				{children}
			</NavLink>
		</li>
	);
}
