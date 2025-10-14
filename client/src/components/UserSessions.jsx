import {
    Plus,
    Calendar,
    Users,
    Circle,
    RefreshCw,
    Trash2,
    Link,
    ArrowRight,
    X,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { authAPI, sessionAPI } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import JoinSession from './JoinSession';
import ActiveUsers from './ActiveUsers';

export default function UserSessions({
    onShowCreateSession,
    onShowDeleteConfirm,
    currentRoomId,
    refreshTrigger,
    userRole,
    activeUsers,
    currentUser,
    onRaiseHand,
    onLowerHand,
    handRaised,
    onDisconnectFromSession,
    raisedHands,
    onToggleMute,
    mutedUsers,
}) {
    const [showDropdown, setShowDropdown] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [user, setUser] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [showJoinModal, setShowJoinModal] = useState(false);

    useEffect(() => {
        const currentUser = authAPI.getCurrentUser();
        setUser(currentUser);
        loadUserSessions();
    }, []);

    // Reload sessions when refreshTrigger changes
    useEffect(() => {
        if (refreshTrigger > 0) {
            loadUserSessions();
        }
    }, [refreshTrigger]);

    const loadUserSessions = async () => {
        try {
            const response = await sessionAPI.getUserSessions();
            setSessions(response.sessions);
        } catch (error) {
            console.error('Error loading sessions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSessionJoined = (sessionData) => {
        setShowJoinModal(false);
        console.log('Session joined:', sessionData);
        // Reload sessions to show the newly joined session
        loadUserSessions();
        // Navigate to the joined session
        if (sessionData.roomId) {
            navigate(`/session/${sessionData.roomId}`);
        }
    };

    const handleLogout = async () => {
        await authAPI.logout();
        navigate('/');
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    const handleJoinSession = async (roomId) => {
        try {
            const result = await sessionAPI.joinSession(roomId);
            console.log('Join session result:', result);
            // Trigger sessions reload to show the newly joined session
            loadUserSessions();
            navigate(`/session/${roomId}`);
        } catch (error) {
            console.error('Error joining session:', error);
        }
    };

    const handleCopyLink = (e, linkShare) => {
        e.stopPropagation();
        navigator.clipboard
            .writeText(linkShare)
            .then(() => {
                showToastMessage('Link copied to clipboard!');
            })
            .catch(() => {
                showToastMessage('Failed to copy link');
            });
    };

    const showToastMessage = (message) => {
        setToastMessage(message);
        setShowToast(true);
        setTimeout(() => {
            setShowToast(false);
        }, 3000);
    };

    const handleDeleteClick = (e, session) => {
        e.stopPropagation();
        onShowDeleteConfirm(session);
    };

    return (
        <>
            <div className="sticky flex h-screen w-full min-w-1/5 flex-col gap-4 border-r border-zinc-600 bg-zinc-950 sm:w-1/4 md:w-1/5 lg:w-1/6">
                <div className="relative flex h-full w-full flex-col justify-between gap-2 text-zinc-400 [&>button]:cursor-pointer [&>button]:rounded [&>button]:bg-zinc-800 [&>button]:px-3 [&>button]:py-2 [&>button]:text-left [&>button]:transition-colors [&>button]:duration-200 [&>button]:hover:bg-zinc-700 [&>button]:hover:text-white">
                    <div className="flex flex-1 flex-col gap-4 overflow-hidden">
                        {/* Show New Session button only for teaching assistants */}
                        {user?.role === 'teaching_assistant' ? (
                            <div className="mx-3 mt-4 flex flex-col gap-4">
                                <button
                                    className="group flex cursor-pointer items-center justify-between rounded px-2 py-1 text-zinc-300 hover:bg-zinc-800"
                                    onClick={onShowCreateSession}
                                >
                                    New Session
                                    <div className="border-l border-zinc-700 pl-2">
                                        <Plus
                                            size={20}
                                            className="transition-transform duration-200 group-hover:rotate-90"
                                        />
                                    </div>
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="mx-3 mt-4">
                                    <button
                                        onClick={() => setShowJoinModal(true)}
                                        className="group flex w-full cursor-pointer items-center justify-between rounded px-2 py-1 text-zinc-300 hover:bg-zinc-800"
                                    >
                                        Join a Session
                                        <ArrowRight size={24} />
                                    </button>
                                </div>
                            </>
                        )}
                        <hr className="border-t border-zinc-800" />
                        <h3 className="flex items-center justify-between bg-none px-3 text-sm">
                            Your Sessions
                            <RefreshCw
                                size={22}
                                className="cursor-pointer rounded p-1 transition-colors duration-200 hover:bg-zinc-800"
                                onClick={loadUserSessions}
                            />
                        </h3>
                        <div className="no-scrollbar flex max-h-5/6 flex-col gap-4 overflow-auto px-3 py-1">
                            {sessions.length === 0 ? (
                                <div className="text-sm">No sessions yet</div>
                            ) : (
                                <div className="flex flex-col gap-4 pr-1">
                                    {sessions.map((session) => (
                                        <div
                                            key={session.roomId}
                                            className="relative"
                                        >
                                            <div
                                                key={session.roomId}
                                                className={`relative cursor-pointer rounded bg-zinc-800 p-3 transition-colors duration-200 hover:bg-zinc-700 ${
                                                    currentRoomId ===
                                                    session.roomId
                                                        ? 'bg-zinc-700 ring-2 ring-blue-500'
                                                        : ''
                                                }`}
                                                onClick={() =>
                                                    handleJoinSession(
                                                        session.roomId
                                                    )
                                                }
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Circle
                                                        size={8}
                                                        className={`${
                                                            session.isActive
                                                                ? 'fill-green-500 text-green-500'
                                                                : 'fill-gray-500 text-gray-500'
                                                        }`}
                                                    />
                                                    <span className="text-sm font-medium">
                                                        {session.language.toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs">
                                                    <Users size={12} />
                                                    <span>
                                                        {session.participants}
                                                    </span>
                                                    <Calendar size={12} />
                                                    <span>
                                                        {formatDate(
                                                            session.createdAt
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="mt-1 truncate text-xs text-zinc-500">
                                                    {session.roomId}
                                                </div>
                                            </div>
                                            <div className="absolute top-3 right-2 z-50 flex gap-1">
                                                <Trash2
                                                    size={22}
                                                    className="cursor-pointer rounded py-1 hover:bg-zinc-700"
                                                    onClick={(e) =>
                                                        handleDeleteClick(
                                                            e,
                                                            session
                                                        )
                                                    }
                                                />
                                                <Link
                                                    size={22}
                                                    className="cursor-pointer rounded py-1 hover:bg-zinc-700"
                                                    onClick={(e) =>
                                                        handleCopyLink(
                                                            e,
                                                            session.linkShare
                                                        )
                                                    }
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="h-fit">
                    <ActiveUsers
                        users={currentRoomId ? activeUsers || [] : []}
                        currentUser={currentUser}
                        onRaiseHand={onRaiseHand}
                        onLowerHand={onLowerHand}
                        handRaised={handRaised}
                        onDisconnectFromSession={onDisconnectFromSession}
                        raisedHands={raisedHands || []}
                        onToggleMute={onToggleMute}
                        mutedUsers={mutedUsers || []}
                        isInSession={!!currentRoomId}
                        onLogout={handleLogout}
                    />
                </div>
            </div>

            {showJoinModal && (
                <div className="fixed inset-0 z-50 flex flex-1 flex-col items-center justify-center gap-6 bg-gray-900/80">
                    <div className="relative w-1/4 bg-gray-100 px-5 py-4 text-gray-800">
                        <button
                            onClick={() => setShowJoinModal(false)}
                            className="absolute -top-3 -right-3 cursor-pointer rounded-full border bg-gray-100 p-1 text-gray-800 transition-transform duration-300 hover:rotate-90 hover:text-gray-700"
                        >
                            <X size={20} />
                        </button>
                        <div className="flex flex-col gap-6">
                            <JoinSession
                                onSessionJoined={handleSessionJoined}
                            />
                        </div>
                    </div>
                </div>
            )}

            {showToast && (
                <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 transform rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-white">
                    <div className="flex items-center gap-2">
                        <Link size={15} />
                        <span className="text-sm">{toastMessage}</span>
                    </div>
                </div>
            )}
        </>
    );
}
