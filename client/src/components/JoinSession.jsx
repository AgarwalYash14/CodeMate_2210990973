import { useState } from 'react';
import { sessionAPI } from '../utils/api';

export default function JoinSession({ onSessionJoined }) {
    const [roomId, setRoomId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!roomId.trim()) return;

        setLoading(true);
        setError('');

        try {
            const response = await sessionAPI.joinSession(roomId.trim());
            console.log('Session joined:', response);
            onSessionJoined &&
                onSessionJoined({ roomId: roomId.trim(), ...response });
        } catch (error) {
            setError(error.message || 'Failed to join session');
            console.error('Session join failed:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <h1 className="text-lg tracking-wide">Join a Session</h1>
            <form
                onSubmit={handleSubmit}
                className="flex w-full flex-col gap-4"
            >
                {error && (
                    <div className="border border-red-200 bg-red-50 p-2 text-sm text-red-600">
                        {error}
                    </div>
                )}
                <div className="flex flex-col gap-2">
                    <label htmlFor="roomId" className="text-sm font-medium">
                        Enter Room ID
                    </label>
                    <input
                        id="roomId"
                        type="text"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                        placeholder="Enter the room ID to join"
                        className="w-full border border-gray-300 bg-gray-100 px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        disabled={loading}
                    />
                </div>
                <button
                    type="submit"
                    disabled={!roomId.trim() || loading}
                    className="cursor-pointer bg-blue-500 px-3 py-2 text-white transition-colors duration-200 hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {loading ? 'Joining...' : 'Join Session'}
                </button>
            </form>
        </>
    );
}
