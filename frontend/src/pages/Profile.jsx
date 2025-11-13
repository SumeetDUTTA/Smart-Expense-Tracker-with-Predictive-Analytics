import React, {useState, useEffect} from "react";
import {useAuth} from "../contexts/authContext";
import api from "../api";

export default function Profile(){
    const {user} = useAuth();
    const [profile, setProfile] = useState(user || null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    async function fetchProfile() {
        setLoading(true);
        try {
            const res = await api.get("/user/profile");
            setProfile(res.data);
        } catch (error) {
            setError(error.response?.data?.message || "Failed to fetch profile");
        } finally {
            setLoading(false);
        }
    }
    useEffect(() => {if(!profile) fetchProfile()}, [])

    return (
        <div className="bg-white p-4 rounded shadow">
            <h2 className="text-lg font-medium">Profile</h2>
            {loading ? <div>Loading…</div> : (
                <div className="mt-2">
                    <div><strong>Name:</strong> {profile?.name}</div>
                    <div><strong>Email:</strong> {profile?.email}</div>
                    <div><strong>Monthly budget:</strong> {profile?.monthlyBudget || '—'}</div>
                    <div><strong>Type:</strong> {profile?.userType || '—'}</div>
                </div>
            )}
        </div>
    )
}