import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // <-- Link EKLENDİ
import api from '../services/api';

const Login = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const response = await api.post('auth/', {
                username,
                password
            });
            
            const token = response.data.token;
            localStorage.setItem('token', token);
            
            navigate('/dashboard'); 
            
        } catch (err: any) {
            console.error('Login failed', err);
            // Eğer hata backend'den geliyorsa (örn: aktif değil)
            if (err.response && err.response.data && err.response.data.non_field_errors) {
                setError(err.response.data.non_field_errors[0]);
            } else {
                setError('Invalid username or password.');
            }
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900">
            <div className="w-full max-w-md p-8 bg-gray-800 rounded-lg shadow-xl border border-gray-700">
                <h2 className="mb-6 text-2xl font-bold text-center text-white">
                    Portfolio Kanban
                </h2>
                
                {error && (
                    <div className="p-3 mb-4 text-sm text-red-200 bg-red-900 rounded border border-red-700">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label 
                            htmlFor="username" 
                            className="block text-sm font-medium text-gray-300"
                        >
                            Username
                        </label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                            placeholder="Enter your username"
                            required
                        />
                    </div>

                    <div>
                        <label 
                            htmlFor="password" 
                            className="block text-sm font-medium text-gray-300"
                        >
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full px-4 py-2 font-bold text-white transition-colors bg-blue-600 rounded hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                    >
                        Sign In
                    </button>
                </form>

                {/* --- YENİ EKLENEN KISIM: REGISTER LINKI --- */}
                <div className="mt-6 text-center text-sm text-gray-400">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-blue-400 hover:text-blue-300 hover:underline">
                        Sign Up
                    </Link>
                </div>
                {/* ------------------------------------------- */}

            </div>
        </div>
    );
};

export default Login;