import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionAPI } from '../utils/api';

export default function CreateSession({ onSessionCreated }) {
    const [language, setLanguage] = useState('python');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await sessionAPI.createSession(language);
            console.log('Session created:', response);
            onSessionCreated && onSessionCreated(response);
        } catch (error) {
            // Check if it's an authentication error
            if (
                error.message.includes('token') ||
                error.message.includes('No token provided')
            ) {
                setError('Your session has expired. Please log in again.');
                setTimeout(() => {
                    navigate('/');
                }, 2000);
            } else {
                setError(error.message);
            }
            console.error('Session creation failed:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <h1 className="text-lg tracking-wide">Create New Session</h1>
            <form
                onSubmit={handleSubmit}
                className="flex w-full flex-col gap-4 [&>select]:border [&>select]:border-gray-300 [&>select]:bg-gray-100 [&>select]:px-3 [&>select]:py-2 [&>select]:tracking-wider [&>select]:text-gray-900 [&>select]:focus:outline-dotted"
            >
                {error && (
                    <div className="border border-red-200 bg-red-50 p-2 text-sm text-red-600">
                        {error}
                    </div>
                )}
                <div className="flex flex-col gap-2">
                    <label htmlFor="language" className="text-sm font-medium">
                        Programming Language
                    </label>
                    <select
                        id="language"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="border border-gray-300 bg-gray-100 px-3 py-2 tracking-wider text-gray-900 focus:outline-dotted"
                    >
                        <option value="python">Python</option>
                        <option value="java">Java</option>
                        <option value="cpp">C++</option>
                    </select>
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="cursor-pointer bg-green-500 px-3 py-2 transition-colors duration-200 hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {loading ? 'Creating...' : 'Create Session'}
                </button>
            </form>
        </>
    );
}
