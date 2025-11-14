import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/authContext";
import api from "../api";
import { User, Mail, Wallet, Settings, Save } from "lucide-react";
import toast from "react-hot-toast";

export default function Profile() {
	const { user } = useAuth();
	const [profile, setProfile] = useState(null);
	const [loading, setLoading] = useState(false);
	const [editing, setEditing] = useState(false);
	const [monthlyBudget, setMonthlyBudget] = useState("");
	const [userType, setUserType] = useState("");

	const allowedUserTypes = [
		{ value: 'college_student', label: 'College Student' },
		{ value: 'young_professional', label: 'Young Professional' },
		{ value: 'family_moderate', label: 'Family (Moderate)' },
		{ value: 'family_high', label: 'Family (High Income)' },
		{ value: 'luxury_lifestyle', label: 'Luxury Lifestyle' },
		{ value: 'senior_retired', label: 'Senior/Retired' }
	];

	async function fetchProfile() {
		setLoading(true);
		try {
			const res = await api.get("/user/profile");
			const userData = res.data.user || res.data;
			setProfile(userData);
			setMonthlyBudget(userData.monthlyBudget || "");
			setUserType(userData.userType || "");
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to fetch profile");
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		if (user) {
			setProfile(user);
			setMonthlyBudget(user.monthlyBudget || "");
			setUserType(user.userType || "");
		}
		fetchProfile();
	}, [user]);

	async function updateBudget(e) {
		e.preventDefault();
		try {
			const payload = {};

			if (monthlyBudget !== "") {
				payload.monthlyBudget = Number(monthlyBudget);
			}

			if (userType !== "") {
				payload.userType = userType;
			}

			if (Object.keys(payload).length === 0) {
				toast.error("Please enter a budget or select a user type");
				return;
			}

			const res = await api.patch("/user/meta", payload);

			if (res.data.success) {
				toast.success("Profile updated successfully!");
				setEditing(false);
				fetchProfile();
			}
		} catch (error) {
			console.error("Update error:", error);
			toast.error(error.response?.data?.message || "Failed to update profile");
		}
	}

	if (loading && !profile) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<span className="loading loading-spinner loading-lg text-primary"></span>
			</div>
		);
	}

	return (
		<div className="space-y-6 max-w-4xl mx-auto p-4">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-4xl font-bold text-primary">Profile</h2>
					<p className="text-base-content/60 mt-1">Manage your account and preferences</p>
				</div>
				<button
					onClick={() => setEditing(!editing)}
					className={`btn ${editing ? 'btn-ghost' : 'btn-primary'} gap-2`}
				>
					<Settings size={20} />
					{editing ? 'Cancel' : 'Edit Settings'}
				</button>
			</div>

			{/* Profile Card */}
			<div className="card bg-base-100 shadow-xl border border-base-300">
				<div className="card-body">
					<div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-6">
						<div className="avatar placeholder">
							<div className="bg-primary text-white rounded-full w-24 h-24 shadow-lg">
								<span className="text-4xl font-bold">{profile?.name?.charAt(0).toUpperCase() || 'U'}</span>
							</div>
						</div>
						<div className="flex-1 text-center md:text-left">
							<h3 className="text-3xl font-bold">{profile?.name || 'User'}</h3>
							<p className="text-base-content/60 mt-1 flex items-center justify-center md:justify-start gap-2">
								<Mail size={16} />
								{profile?.email || ''}
							</p>
							<div className="badge badge-primary badge-lg mt-3">
								{allowedUserTypes.find(t => t.value === profile?.userType)?.label || 'Standard'} Account
							</div>
						</div>
					</div>

					<div className="divider"></div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="flex items-center gap-3 p-4 bg-base-200 rounded-xl">
							<div className="bg-primary/20 p-3 rounded-lg">
								<User className="text-primary" size={24} />
							</div>
							<div className="flex-1">
								<p className="text-xs text-base-content/60 font-medium">Full Name</p>
								<p className="font-bold text-base-content">{profile?.name || '—'}</p>
							</div>
						</div>

						<div className="flex items-center gap-3 p-4 bg-base-200 rounded-xl">
							<div className="bg-secondary/20 p-3 rounded-lg">
								<Mail className="text-secondary" size={24} />
							</div>
							<div className="flex-1">
								<p className="text-xs text-base-content/60 font-medium">Email</p>
								<p className="font-bold text-base-content truncate">{profile?.email || '—'}</p>
							</div>
						</div>

						<div className="flex items-center gap-3 p-4 bg-base-200 rounded-xl">
							<div className="bg-success/20 p-3 rounded-lg">
								<Wallet className="text-success" size={24} />
							</div>
							<div className="flex-1">
								<p className="text-xs text-base-content/60 font-medium">Account Type</p>
								<p className="font-bold text-base-content capitalize">
									{allowedUserTypes.find(t => t.value === profile?.userType)?.label || 'Not Set'}
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Budget Settings */}
			<div className="card bg-base-100 shadow-xl border border-base-300">
				<div className="card-body">
					<h3 className="card-title flex items-center gap-2 text-2xl">
						<Wallet size={28} className="text-primary" />
						Budget & Settings
					</h3>
					<p className="text-base-content/60 mb-4">
						Set your monthly spending limit and account type to personalize your experience
					</p>

					{editing ? (
						<form onSubmit={updateBudget} className="space-y-6">
							{/* Monthly Budget */}
							<div className="w-full">
								<label className="block text-sm font-medium mb-2">
									Monthly Budget (₹)
								</label>
								<div className="relative">
									<span className="absolute left-4 top-4 text-xl text-primary font-bold">₹</span>
									<input
										type="number"
										step="0.01"
										min="0"
										placeholder="Enter your monthly budget"
										value={monthlyBudget}
										onChange={(e) => setMonthlyBudget(e.target.value)}
										className="input input-bordered input-lg w-full pl-12 text-xl font-semibold"
									/>
								</div>
								<p className="text-sm text-base-content/60 mt-2">
									This helps you monitor your spending habits
								</p>
							</div>

							{/* User Type */}
							<div className="w-full">
								<label className="block text-sm font-medium mb-2">
									Account Type
								</label>
								<select
									value={userType}
									onChange={(e) => setUserType(e.target.value)}
									className="select select-bordered select-lg w-full"
								>
									<option value="">Select Account Type</option>
									{allowedUserTypes.map((type) => (
										<option key={type.value} value={type.value}>
											{type.label}
										</option>
									))}
								</select>
								<p className="text-sm text-base-content/60 mt-2">
									Select the type that best describes your spending profile
								</p>
							</div>

							<div className="flex gap-3">
								<button type="submit" className="btn btn-primary gap-2 flex-1">
									<Save size={20} />
									Save Changes
								</button>
								<button
									type="button"
									onClick={() => setEditing(false)}
									className="btn btn-outline"
								>
									Cancel
								</button>
							</div>
						</form>
					) : (
						<div className="space-y-4">
							{/* Budget Display */}
							<div className="bg-primary text-primary-content rounded-2xl p-6 shadow-xl">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm opacity-90 font-medium mb-2">Current Monthly Budget</p>
										<h2 className="text-5xl font-bold">
											₹{profile?.monthlyBudget ? Number(profile.monthlyBudget).toFixed(2) : '0.00'}
										</h2>
										<p className="text-sm opacity-80 mt-3">
											{profile?.monthlyBudget ? '✓ Active budget limit' : '⚠ No budget set yet'}
										</p>
									</div>
									<div className="bg-white/20 p-4 rounded-xl">
										<Wallet size={48} />
									</div>
								</div>
							</div>

							{/* User Type Display */}
							<div className="stats shadow w-full">
								<div className="stat">
									<div className="stat-figure text-primary">
										<User size={32} />
									</div>
									<div className="stat-title">Account Type</div>
									<div className="stat-value text-primary text-2xl">
										{allowedUserTypes.find(t => t.value === profile?.userType)?.label || 'Not Set'}
									</div>
									<div className="stat-desc">Your spending profile category</div>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Account Stats */}
			<div className="card bg-base-100 shadow-xl border border-base-300">
				<div className="card-body">
					<h3 className="card-title text-2xl mb-4">Account Information</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div className="stats shadow bg-base-200">
							<div className="stat">
								<div className="stat-figure text-primary">
									<User size={32} />
								</div>
								<div className="stat-title font-medium">Member Since</div>
								<div className="stat-value text-2xl text-primary">
									{profile?.createdAt
										? new Date(profile.createdAt).toLocaleDateString('en-US', {
											month: 'short',
											day: 'numeric',
											year: 'numeric'
										})
										: 'N/A'}
								</div>
								<div className="stat-desc">Account creation date</div>
							</div>
						</div>
						<div className="stats shadow bg-base-200">
							<div className="stat">
								<div className="stat-figure text-secondary">
									<Settings size={32} />
								</div>
								<div className="stat-title font-medium">Last Updated</div>
								<div className="stat-value text-2xl text-secondary">
									{profile?.updatedAt
										? new Date(profile.updatedAt).toLocaleDateString('en-US', {
											month: 'short',
											day: 'numeric',
											year: 'numeric'
										})
										: 'N/A'}
								</div>
								<div className="stat-desc">Profile last modified</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}