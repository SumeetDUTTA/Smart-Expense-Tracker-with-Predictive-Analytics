import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/authContext";
import { UserPlus, Mail, Lock, User, LoaderIcon } from "lucide-react";
import toast from "react-hot-toast";

export default function Register() {
	const { register } = useAuth();
	const nav = useNavigate();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);

	if (loading) {
		return (
			<div className="min-h-screen bg-base-200 flex items-center justify-center">
				<LoaderIcon className="size-10 animate-spin text-primary" />
			</div>
		)
	}

	async function submit(event) {
		event.preventDefault();
		setLoading(true);

		try {
			await register({ name, email, password });
			toast.success("Account created successfully!");
			nav("/");
		} catch (error) {
			console.error('Registration error:', error);
			toast.error(error.response?.data?.message || "Registration failed");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className='min-h-screen bg-transparent'>
			<div className="absolute inset-0 -z-10 h-full w-full items-center px-5 py-24 [background:radial-gradient(125%_125%_at_50%_10%,#000_60%,#00FF9D40_100%)]" />
			<div className='container mx-auto px-4 py-8'>
				<div className='max-w-2xl mx-auto mt-10'>
					<div className='card bg-base-100'>
						<div className='card-body'>
							<form onSubmit={submit} >
								<div className='form-control mb-4'>
									<div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-primary flex items-center justify-center text-white shadow-2xl mb-6 animate-pulse">
										<UserPlus size={40} />
									</div>
									<h2 className="text-2xl font-bold mb-4">Register</h2>
									<label className="block mb-2">
										<span className="label-text font-medium flex items-center gap-2">
											<User size={18} className="text-primary" />
											User Name
										</span>
									</label>
									<input
										type="text"
										value={name}
										onChange={(e) => setName(e.target.value)}
										required
										className="input input-bordered w-full mb-4"
									/>
								</div>
								<div className='form-control mb-4'>
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
								</div>

								<div className='form-control mb-4'>
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
										minLength="6"
									/>
									<label className="label">
										<span className="label-text-alt text-base-content/60">
											Must be at least 6 characters
										</span>
									</label>
								</div>

								<div className="card-actions justify-end">
									<button type="submit" className="btn btn-primary w-full" disabled={loading}>
										{loading ? "Registering..." : "Register"}
									</button>
								</div>
							</form>
							<p className="mt-4 text-center text-sm">
								Already have an account?{" "}
								<Link to="/login" className="text-primary font-semibold">
									Login
								</Link>
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}