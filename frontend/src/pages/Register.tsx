import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        email: '',
        first_name: '',
        last_name: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.id]: e.target.value
        });
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            await api.post('register/', formData);
            setSuccess(true);
        } catch (err: any) {
            console.error('Registration failed', err);
            if (err.response && err.response.data) {
                // Hata mesajını yakala ve göster
                const errorData = err.response.data;
                // Eğer hata bir obje ise (örn: {username: ['Exists']}) stringe çevir
                const errorMsg = typeof errorData === 'object' 
                    ? Object.values(errorData).flat().join(', ') 
                    : 'Registration failed.';
                setError(errorMsg);
            } else {
                setError('Registration failed. Please try again.');
            }
        }
    };

    if (success) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900 p-4">
                <div className="w-full max-w-md p-8 bg-gray-800 rounded-lg shadow-xl border border-gray-700 text-center">
                    <div className="text-5xl mb-4">✅</div>
                    <h2 className="text-2xl font-bold text-white mb-2">Registration Successful!</h2>
                    <p className="text-gray-300 mb-6">
                        Your account has been created. <br />
                        <span className="text-yellow-400 font-semibold">Please wait for an IT Administrator to approve your account.</span>
                    </p>
                    <Link to="/" className="text-blue-400 hover:text-blue-300 underline">
                        Back to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900 p-4">
            <div className="w-full max-w-md p-8 bg-gray-800 rounded-lg shadow-xl border border-gray-700">
                <h2 className="mb-6 text-2xl font-bold text-center text-white">Create Account</h2>
                
                {error && (
                    <div className="p-3 mb-4 text-sm text-red-200 bg-red-900 rounded border border-red-700">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="first_name" className="block text-sm font-medium text-gray-300">First Name</label>
                            <input id="first_name" type="text" onChange={handleChange} className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div>
                            <label htmlFor="last_name" className="block text-sm font-medium text-gray-300">Last Name</label>
                            <input id="last_name" type="text" onChange={handleChange} className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-300">Username *</label>
                        <input id="username" type="text" required onChange={handleChange} className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email</label>
                        <input id="email" type="email" onChange={handleChange} className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-300">Password *</label>
                        <input id="password" type="password" required onChange={handleChange} className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>

                    <button type="submit" className="w-full px-4 py-2 font-bold text-white bg-blue-600 rounded hover:bg-blue-500 transition-colors mt-4">
                        Register
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-400">
                    Already have an account?{' '}
                    <Link to="/" className="text-blue-400 hover:text-blue-300 hover:underline">
                        Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Register; // <-- BU SATIR EKSİKTİ!