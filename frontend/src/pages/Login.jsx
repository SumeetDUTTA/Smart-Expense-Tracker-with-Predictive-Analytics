import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	UserPlus, Mail, Lock, User, LogIn, Eye, EyeOff,
	LoaderCircle
} from "lucide-react";
import toast from "react-hot-toast";

import { useAuth } from "../contexts/authContext";
import "../styles/LoginSignup.css";

export default function Login() {
	const { login, register } = useAuth();
	const nav = useNavigate();

	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [mode, setMode] = useState("signup");
	const [showPassword, setShowPassword] = useState(false);
	const [remember, setRemember] = useState(false);

	const isValid = () => {
		if (!email || !password) return false;
		if (mode === "signup" && !name) return false;
		return true;
	};

	async function submit(event) {
		event.preventDefault();
		if (!isValid()) {
			toast.error("Please fill required fields");
			return;
		}

		setLoading(true);
		try {
			if (mode === "signup") {
				await register({ name, email, password });
				toast.success("Account created!");
			} else {
				await login({ email, password, remember });
				toast.success("Welcome back!");
			}
			nav("/");
		} catch (err) {
			toast.error(err?.response?.data?.message || "Something went wrong");
		} finally {
			setLoading(false);
		}
	}

	if (loading) {
		return (
			<div className="loader-screen" role="status" aria-live="polite">
				<div style={{ textAlign: 'center' }}>
					<LoaderCircle size={48} className="animate-spin" />
					<div style={{ marginTop: 8, color: 'var(--muted)' }}>Loading dashboard…</div>
				</div>
			</div>
		);
	}

	return (
		<main className="screen">
			<div className="container">

				{/* HEADER FIXED */}
				<header className="header">
					<div className="title-wrapper">
						<h1 className="text">
							{mode === "signup" ? "Create Account" : "Welcome Back"}
						</h1>
						<div className="underline" />
					</div>
					<p className="subtitle">
						{mode === "signup"
							? "Track your spending smarter in just a minute."
							: "Sign in to access your dashboard."}
					</p>
				</header>

				<section className="card">

					{/* ALWAYS SHOW BOTH TABS */}
					<div className="tabs">
						<button
							className={`tab ${mode === "signup" ? "active" : ""}`}
							onClick={() => setMode("signup")}
							type="button"
						>
							<UserPlus size={16} /> Sign up
						</button>

						<button
							className={`tab ${mode === "login" ? "active" : ""}`}
							onClick={() => setMode("login")}
							type="button"
						>
							<LogIn size={16} /> Login
						</button>
					</div>

					<form onSubmit={submit} className="form">

						{mode === "signup" && (
							<label className="input">
								<User className="icon" />
								<input
									type="text"
									placeholder="Full name"
									value={name}
									onChange={(e) => setName(e.target.value)}
								/>
							</label>
						)}

						<label className="input">
							<Mail className="icon" />
							<input
								type="email"
								placeholder="Email address"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
							/>
						</label>

						<label className="input input-with-action">
							<Lock className="icon" />
							<input
								type={showPassword ? "text" : "password"}
								placeholder="Password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
							/>
							<button
								type="button"
								className="icon-action"
								onClick={() => setShowPassword((v) => !v)}
							>
								{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
							</button>
						</label>

						{/* Remember me visible FIX */}
						{mode === "login" && (
							<label className="checkbox-label">
								<input
									type="checkbox"
									checked={remember}
									onChange={(e) => setRemember(e.target.checked)}
								/>
								Remember me
							</label>
						)}

						{!isValid() && (
							<div className="error-text">Please fill all required fields.</div>
						)}

						<button
							className="submit"
							type="submit"
							disabled={!isValid()}
						>
							{mode === "signup" ? "Create account" : "Login"}
						</button>
					</form>

				</section>

				<footer className="small-footer">
					<span>Made with ❤️</span>
					<span className="version">v1.0</span>
				</footer>

			</div>
		</main>
	);
}
