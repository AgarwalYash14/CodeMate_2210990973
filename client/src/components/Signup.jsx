import { useState } from 'react';
import { authAPI } from '../utils/api';
import { cookieUtils } from '../utils/cookies';
import { CircleCheck } from 'lucide-react';

export default function Signup({ onSwitchToLogin }) {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [registered, setRegistered] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Client-side validation
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            const response = await authAPI.register(username, email, password);
            console.log('Registration successful:', response);

            if (response.user) {
                // Set user cookie with same expiration as authToken (1 day)
                cookieUtils.set('user', JSON.stringify(response.user), 1);
            }

            setRegistered(true);
            setUsername('');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
        } catch (error) {
            setError(error.message);
            console.error('Registration failed:', error);
        } finally {
            setLoading(false);
        }
    };

    // Show success screen after registration
    if (registered) {
        return (
            <div className="flex flex-col items-center justify-center gap-6 text-center">
                <h1 className="text-2xl font-semibold text-green-700">
                    Registration Successful!
                </h1>
                <button
                    onClick={onSwitchToLogin}
                    className="flex cursor-pointer items-center gap-2 bg-green-600 px-2 py-1 text-gray-50 transition-colors duration-200 hover:bg-green-700"
                >
                    Ok <CircleCheck size={20} />
                </button>
            </div>
        );
    }

    return (
        <>
            <h1 className="text-lg tracking-wide">
                Register Your CodeMate Account
            </h1>
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
                    type="text"
                    placeholder="Enter Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
                <input
                    type="email"
                    placeholder="Enter Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Create Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Re-Enter Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="cursor-pointer bg-green-500 px-3 py-2 transition-colors duration-200 hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {loading ? 'Registering...' : 'Register'}
                </button>
            </form>
            <p className="text-sm">
                Already have an Account?{' '}
                <button
                    onClick={onSwitchToLogin}
                    className="cursor-pointer text-green-800 hover:text-green-700"
                >
                    Login
                </button>
            </p>
        </>
    );
}
