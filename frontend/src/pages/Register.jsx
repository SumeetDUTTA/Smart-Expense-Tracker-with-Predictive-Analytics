import React, {useState} from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/authContext";

export default function Register(){
    const { register } = useAuth();
    const nav = useNavigate();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);

    async function submit(event) {
        event.preventDefault();
        setError(null);
        try {
            await register({name, email, password});
            nav("/expenses");
        } catch (error) {
            setError(error.response?.data?.message || "Registration failed");
        }
    }

    return (
        <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
            <h2 className="text-lg font-medium mb-4">Register</h2>
            {error && <div className="text-red-600 mb-3">{error}</div>}
            <form onSubmit={submit} className="space-y-3">
                <input required placeholder="Full name" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border rounded" />
                <input required type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 border rounded" />
                <input required type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2 border rounded" />
                <div className="flex justify-between items-center">
                    <button className="bg-green-600 text-white px-4 py-2 rounded">Create account</button>
                </div>
            </form>
        </div>
    )
}