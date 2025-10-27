import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../utils/api';
import { cookieUtils } from '../utils/cookies';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await authAPI.login(email, password);
            console.log('Login successful:', response);

            if (response.user) {
                // Set user cookie with same expiration as authToken (1 day)
                cookieUtils.set('user', JSON.stringify(response.user), 1);
            }

            navigate('/session');
        } catch (error) {
            setError(error.message);
            console.error('Login failed:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <form
                onSubmit={handleSubmit}
                className="flex w-full flex-col gap-4 [&>input]:border [&>input]:border-gray-300 [&>input]:bg-gray-100 [&>input]:px-3 [&>input]:py-2 [&>input]:tracking-wider [&>input]:text-gray-900 [&>input]:focus:outline-dotted"
            >
                {error && (
                    <div className="border border-red-200 bg-red-50 p-2 text-sm text-red-600">
                        {error}
                    </div>
                )}
                <input
                    type="email"
                    placeholder="Enter Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="cursor-pointer bg-green-500 px-3 py-2 transition-colors duration-200 hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {loading ? 'Logging in...' : 'Login'}
                </button>
            </form>
        </>
    );
}
