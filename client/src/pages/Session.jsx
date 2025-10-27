import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import Editor from '../components/Editor';
import UserSessions from '../components/UserSessions';
import CreateSession from '../components/CreateSession';
import JoinSession from '../components/JoinSession';
import { sessionAPI, authAPI } from '../utils/api';
import { X, Plus, ArrowRight, UserPlus, UserMinus } from 'lucide-react';
import logo from '../../public/logo.svg';

export default function Session() {
    const { roomId } = useParams();
    const [showCreateSession, setShowCreateSession] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [sessionToDelete, setSessionToDelete] = useState(null);
    const [currentSession, setCurrentSession] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [refreshSessions, setRefreshSessions] = useState(0);
    const navigate = useNavigate();
    const socketRef = useRef(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('info'); // 'join' or 'leave'
    const [activeUsers, setActiveUsers] = useState([]);
    const [handRaised, setHandRaised] = useState(false);
    const [raisedHands, setRaisedHands] = useState([]);
    const [mutedUsers, setMutedUsers] = useState([]);

    // Check authentication on mount
    useEffect(() => {
        const checkAuth = async () => {
            if (!authAPI.isAuthenticated()) {
                navigate('/');
                return;
            }

            // Validate that the token is still valid by making a test request
            try {
                await sessionAPI.getUserSessions();
                // Store current user info for socket connection
                if (authAPI.getCurrentUser()) {
                    setCurrentUser(authAPI.getCurrentUser());
                }
            } catch (error) {
                // If token is invalid/expired, clear cookies and redirect to login
                if (
                    error.message.includes('token') ||
                    error.message.includes('401')
                ) {
                    console.log(
                        'Token expired or invalid, redirecting to login'
                    );
                    authAPI.logout();
                    navigate('/');
                }
            }
        };

        checkAuth();
    }, [navigate]);

    // Initialize socket connection
    useEffect(() => {
        if (!socketRef.current) {
            const socketUrl =
                import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
            socketRef.current = io(socketUrl, {
                withCredentials: true,
                transports: ['websocket', 'polling'],
            });

            socketRef.current.on('connect', () => {
                console.log('Socket connected:', socketRef.current.id);
            });

            socketRef.current.on('disconnect', () => {
                console.log('Socket disconnected');
            });

            socketRef.current.on('connect_error', (error) => {
                console.error('Socket connection error:', error);
            });
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, []);

    // Handle room joining when roomId changes
    useEffect(() => {
        if (roomId && socketRef.current && currentUser) {
            console.log(
                'Attempting to join room:',
                roomId,
                'with user:',
                currentUser
            );

            // Join the room
            socketRef.current.emit('join-room', {
                roomId,
                user: currentUser,
            });

            console.log(`Joined room: ${roomId}`);
        } else {
            console.log('Cannot join room:', {
                hasRoomId: !!roomId,
                hasSocket: !!socketRef.current,
                hasCurrentUser: !!currentUser,
            });
        }

        // Cleanup: leave room when component unmounts or roomId changes
        return () => {
            if (roomId && socketRef.current && currentUser) {
                console.log('Leaving room:', roomId);
                socketRef.current.emit('leave-room', {
                    roomId,
                    userId: currentUser.id,
                });
            }
        };
    }, [roomId, currentUser]);

    // Socket listeners for user join/leave events
    useEffect(() => {
        if (!socketRef.current || !roomId) return;

        const handleUserJoined = ({ user }) => {
            // Don't show notification for own join
            if (currentUser && user.id === currentUser.id) return;

            showToastMessage(`${user.name} joined the session`, 'join');
            // Trigger refresh of sessions list to update participant count
            setRefreshSessions((prev) => prev + 1);
        };

        const handleUserLeft = ({ user }) => {
            // Don't show notification for own leave
            if (currentUser && user.id === currentUser.id) return;

            showToastMessage(`${user.name} left the session`, 'leave');
            // Trigger refresh of sessions list to update participant count
            setRefreshSessions((prev) => prev + 1);
        };

        const handleUsersInRoom = (users) => {
            setActiveUsers(users);
        };

        const handleHandRaised = ({ userId }) => {
            setRaisedHands((prev) => [...new Set([...prev, userId])]);
        };

        const handleHandLowered = ({ userId }) => {
            setRaisedHands((prev) => prev.filter((id) => id !== userId));
        };

        const handleUserMuted = ({ userId }) => {
            setMutedUsers((prev) => [...new Set([...prev, userId])]);
        };

        const handleUserUnmuted = ({ userId }) => {
            setMutedUsers((prev) => prev.filter((id) => id !== userId));
        };

        socketRef.current.on('user-joined', handleUserJoined);
        socketRef.current.on('user-left', handleUserLeft);
        socketRef.current.on('users-in-room', handleUsersInRoom);
        socketRef.current.on('hand-raised', handleHandRaised);
        socketRef.current.on('hand-lowered', handleHandLowered);
        socketRef.current.on('user-muted', handleUserMuted);
        socketRef.current.on('user-unmuted', handleUserUnmuted);

        return () => {
            if (socketRef.current) {
                socketRef.current.off('user-joined', handleUserJoined);
                socketRef.current.off('user-left', handleUserLeft);
                socketRef.current.off('users-in-room', handleUsersInRoom);
                socketRef.current.off('hand-raised', handleHandRaised);
                socketRef.current.off('hand-lowered', handleHandLowered);
                socketRef.current.off('user-muted', handleUserMuted);
                socketRef.current.off('user-unmuted', handleUserUnmuted);
            }
        };
    }, [roomId, currentUser]);

    const showToastMessage = (message, type = 'info') => {
        setToastMessage(message);
        setToastType(type);
        setShowToast(true);
        setTimeout(() => {
            setShowToast(false);
        }, 3000);
    };

    const handleRaiseHand = async () => {
        if (!roomId || !socketRef.current) return;

        try {
            await sessionAPI.raiseHand(roomId);
            setHandRaised(true);
            socketRef.current.emit('raise-hand', {
                roomId,
                userId: currentUser.id,
            });
        } catch (error) {
            console.error('Error raising hand:', error);
        }
    };

    const handleLowerHand = async () => {
        if (!roomId || !socketRef.current) return;

        try {
            await sessionAPI.lowerHand(roomId);
            setHandRaised(false);
            socketRef.current.emit('lower-hand', {
                roomId,
                userId: currentUser.id,
            });
        } catch (error) {
            console.error('Error lowering hand:', error);
        }
    };

    const handleDisconnectFromSession = async () => {
        if (!roomId || !currentUser) return;

        try {
            // Leave session via API (updates database)
            await sessionAPI.leaveSession(roomId);

            // Emit socket event to notify other users
            if (socketRef.current) {
                socketRef.current.emit('leave-room', {
                    roomId,
                    userId: currentUser.id,
                });
            }

            // Navigate back to main session page
            navigate('/session');
            showToastMessage('Left session successfully', 'leave');
        } catch (error) {
            console.error('Error leaving session:', error);
            showToastMessage('Error leaving session', 'error');
        }
    };

    const handleToggleMute = (userId) => {
        if (!roomId || !socketRef.current) return;

        const isMuted = mutedUsers.includes(userId);

        if (isMuted) {
            // Unmute user
            setMutedUsers((prev) => prev.filter((id) => id !== userId));
            socketRef.current.emit('unmute-user', { roomId, userId });
            if (userId === currentUser?.id) {
                showToastMessage('You unmuted yourself', 'info');
            } else {
                showToastMessage('User unmuted', 'info');
            }
        } else {
            // Mute user
            setMutedUsers((prev) => [...new Set([...prev, userId])]);
            socketRef.current.emit('mute-user', { roomId, userId });
            if (userId === currentUser?.id) {
                showToastMessage('You muted yourself', 'info');
            } else {
                showToastMessage('User muted', 'info');
            }
        }
    };
    useEffect(() => {
        if (roomId) {
            loadSessionData(roomId);
        }
    }, [roomId]);

    const loadSessionData = async (sessionRoomId) => {
        setLoading(true);
        try {
            // Load specific session data - gracefully handle if API endpoint doesn't exist yet
            const sessionData = await sessionAPI.getSession(sessionRoomId);
            setCurrentSession(sessionData);
        } catch (error) {
            console.error('Error loading session data:', error);
            // If the API endpoint doesn't exist, just set a basic session object
            setCurrentSession({ roomId: sessionRoomId });
        } finally {
            setLoading(false);
        }
    };

    const handleSessionCreated = (newSession) => {
        setShowCreateSession(false);
        console.log('New session created:', newSession);

        // Trigger refresh of sessions list
        setRefreshSessions((prev) => prev + 1);

        // Navigate to the new session
        if (newSession.roomId) {
            navigate(`/session/${newSession.roomId}`);
        }
    };

    const handleSessionJoined = (sessionData) => {
        setShowJoinModal(false);
        console.log('Session joined:', sessionData);
        // Navigate to the joined session
        if (sessionData.roomId) {
            navigate(`/session/${sessionData.roomId}`);
        }
    };

    const confirmDelete = async () => {
        if (!sessionToDelete) return;

        try {
            await sessionAPI.deleteSession(sessionToDelete.roomId);
            setShowDeleteConfirm(false);
            setSessionToDelete(null);

            // Trigger refresh of sessions list
            setRefreshSessions((prev) => prev + 1);

            // If we're deleting the currently active session, navigate back to main session page
            if (roomId === sessionToDelete.roomId) {
                navigate('/session');
            }
        } catch (error) {
            console.error('Error deleting session:', error);
            // You might want to show an error message
        }
    };

    const cancelDelete = () => {
        setShowDeleteConfirm(false);
        setSessionToDelete(null);
    };

    return (
        <>
            <div className="relative flex h-screen bg-zinc-900 text-gray-50">
                <UserSessions
                    onShowCreateSession={() => setShowCreateSession(true)}
                    onShowDeleteConfirm={(session) => {
                        setSessionToDelete(session);
                        setShowDeleteConfirm(true);
                    }}
                    currentRoomId={roomId}
                    refreshTrigger={refreshSessions}
                    activeUsers={activeUsers}
                    currentUser={currentUser}
                    onRaiseHand={handleRaiseHand}
                    onLowerHand={handleLowerHand}
                    handRaised={handRaised}
                    onDisconnectFromSession={handleDisconnectFromSession}
                    raisedHands={raisedHands}
                    onToggleMute={handleToggleMute}
                    mutedUsers={mutedUsers}
                />
                <div className="flex h-screen w-full flex-col bg-zinc-800">
                    {roomId ? (
                        <>
                            <div className="relative flex-1 overflow-hidden">
                                {loading ? (
                                    <div className="flex h-full items-center justify-center text-zinc-300">
                                        <div className="text-lg">
                                            Loading session...
                                        </div>
                                    </div>
                                ) : (
                                    <Editor
                                        currentSession={currentSession}
                                        roomId={roomId}
                                        socket={socketRef.current}
                                        currentUser={currentUser}
                                    />
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex h-full items-center justify-center">
                            <div className="flex flex-col items-center gap-8 text-zinc-300">
                                <div className="flex flex-col items-center gap-4 text-center">
                                    <img
                                        src={logo}
                                        alt="CodeMate Logo"
                                        className="h-auto w-16"
                                    />
                                    <h2 className="text-2xl font-semibold">
                                        Welcome to CodeMate
                                    </h2>
                                    <p className="text-zinc-400">
                                        Choose an option to get started
                                    </p>
                                </div>
                                <div className="flex w-full flex-col gap-4">
                                    {currentUser?.role ===
                                        'teaching_assistant' && (
                                        <button
                                            onClick={() =>
                                                setShowCreateSession(true)
                                            }
                                            className="flex cursor-pointer items-center justify-between gap-3 rounded-lg bg-green-600 px-6 py-4 text-lg font-medium text-white transition-colors duration-200 hover:bg-green-700"
                                        >
                                            Create New Session
                                            <Plus size={24} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setShowJoinModal(true)}
                                        className="flex cursor-pointer items-center justify-between gap-3 rounded-lg bg-blue-600 px-6 py-4 text-lg font-medium text-white transition-colors duration-200 hover:bg-blue-700"
                                    >
                                        Join a Session
                                        <ArrowRight size={24} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
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

            {showCreateSession && (
                <div className="fixed inset-0 z-50 flex flex-1 flex-col items-center justify-center gap-6 bg-gray-900/80">
                    <div className="relative w-1/4 bg-gray-100 px-5 py-4 text-gray-800">
                        <button
                            onClick={() => setShowCreateSession(false)}
                            className="absolute -top-3 -right-3 cursor-pointer rounded-full border bg-gray-100 p-1 text-gray-800 transition-transform duration-300 hover:rotate-90 hover:text-gray-700"
                        >
                            <X size={20} />
                        </button>
                        <div className="flex flex-col gap-6">
                            <CreateSession
                                onSessionCreated={handleSessionCreated}
                            />
                        </div>
                    </div>
                </div>
            )}

            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex flex-1 flex-col items-center justify-center gap-6 bg-gray-900/80">
                    <div className="relative w-1/4 bg-gray-100 px-5 py-4 text-gray-800">
                        <button
                            onClick={cancelDelete}
                            className="absolute -top-3 -right-3 cursor-pointer rounded-full border bg-gray-100 p-1 text-gray-800 transition-transform duration-300 hover:rotate-90 hover:text-gray-700"
                        >
                            <X size={20} />
                        </button>
                        <div className="flex flex-col gap-2">
                            <h1 className="text-lg tracking-wide">
                                Delete Session
                            </h1>
                            <div className="flex flex-col gap-4">
                                <p className="text-sm">
                                    Are you sure you want to delete this
                                    session?
                                </p>
                                <div className="flex items-center justify-between rounded bg-gray-200 p-3">
                                    <span className="text-sm font-medium">
                                        {sessionToDelete?.language.toUpperCase()}
                                    </span>
                                    <div className="text-xs text-gray-600">
                                        /{sessionToDelete?.roomId}
                                    </div>
                                </div>
                                <button
                                    onClick={confirmDelete}
                                    className="cursor-pointer bg-red-500 px-3 py-2 text-sm text-white transition-colors duration-200 hover:bg-red-600"
                                >
                                    Delete Session (this action cannot be
                                    undone)
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showToast && (
                <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 transform rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-white shadow-lg">
                    <div className="flex items-center gap-2">
                        {toastType === 'join' ? (
                            <UserPlus size={18} className="text-green-400" />
                        ) : (
                            <UserMinus size={18} className="text-red-400" />
                        )}
                        <span className="text-sm">{toastMessage}</span>
                    </div>
                </div>
            )}
        </>
    );
}
