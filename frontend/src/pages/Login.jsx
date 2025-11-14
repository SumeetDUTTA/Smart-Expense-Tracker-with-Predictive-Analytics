import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/authContext";
import { LogIn, Mail, Lock, LoaderIcon } from "lucide-react";
import toast from "react-hot-toast";

export default function Login() {
	const { login } = useAuth();
	const nav = useNavigate();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);

	if (loading) {
		return (
			<div className="min-h-screen bg-base-200 flex items-center justify-center">
				<LoaderIcon className="size-10 animate-spin text-primary" />
			</div>
		);
	}
	async function submit(event) {
		event.preventDefault();
		setLoading(true);

		try {
			await login({ email, password });
			toast.success("Welcome back!");
			nav("/");
		} catch (error) {
			console.error('Login error:', error);
			toast.error(error.response?.data?.message || "Login failed");
		} finally {
			setLoading(false);
		}
	}
	return (
		<div className="min-h-screen bg-transparent">
			<div className="absolute inset-0 -z-10 h-full w-full items-center px-5 py-24 [background:radial-gradient(125%_125%_at_50%_10%,#000_60%,#00FF9D40_100%)]" />
			<div className="container mx-auto px-4 py-8">
				<div className="max-w-md mx-auto mt-11">
					<div className="card bg-base-100">
						<div className="card-body">
							<form onSubmit={submit}>
								<h2 className="text-2xl font-bold mb-4">Login</h2>

								<label className="block mb-2">
									<span className="label-text font-medium flex items-center gap-2">
										<Mail size={18} className="text-primary" />
										Email Address
									</span>
								</label>
								<input
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									required
									className="input input-bordered w-full mb-4"
								/>

								<label className="block mb-2">
									<span className="label-text font-medium flex items-center gap-2">
										<Lock size={18} className="text-primary" />
										Password
									</span>
								</label>
								<input
									type="password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
									className="input input-bordered w-full mb-6"
								/>

								<button
									type="submit"
									className="btn btn-primary w-full"
									disabled={loading}
								>
									{loading ? "Logging in…" : "Login"}
								</button>
							</form>

							<p className="mt-4 text-center text-sm">
								Don’t have an account?{" "}
								<Link to="/register" className="text-primary font-semibold">
									Register
								</Link>
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}