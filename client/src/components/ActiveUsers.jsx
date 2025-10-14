import {
    Users,
    Hand,
    LogOut,
    Mic,
    MicOff,
    Settings,
    ChevronUp,
    ChevronDown,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

export default function ActiveUsers({
    users,
    currentUser,
    onRaiseHand,
    onLowerHand,
    handRaised,
    onDisconnectFromSession,
    raisedHands = [],
    onToggleMute,
    mutedUsers = [],
    isInSession = false,
    onLogout,
}) {
    const [isMinimized, setIsMinimized] = useState(false);
    const [showSettings, setShowSettings] = useState(null);
    const settingsRef = useRef(null);

    // Close settings dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                settingsRef.current &&
                !settingsRef.current.contains(event.target)
            ) {
                setShowSettings(null);
            }
        };

        if (showSettings) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showSettings]);

    return (
        <div className="relative flex max-h-[25vh] flex-col bg-zinc-900">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-700 bg-zinc-800 px-2 text-sm text-zinc-300">
                {isInSession && users.length > 1 && (
                    <>
                        <h1>In session</h1>
                        <button
                            className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-zinc-700"
                            onClick={() => setIsMinimized(!isMinimized)}
                        >
                            ({users.length})
                            <Users size={18} />
                        </button>
                    </>
                )}
            </div>

            {/* Users List */}
            <div className="flex-1 overflow-y-hidden px-2 py-3">
                <div className="flex flex-col">
                    {/* Current User - Always visible */}
                    {currentUser && (
                        <div className="rounded-lg border border-blue-700 bg-blue-900/30 px-3 py-2">
                            <div className="flex w-full items-center justify-between gap-2">
                                <div className="flex min-w-0 flex-1 flex-col">
                                    <span className="truncate text-sm font-medium text-zinc-200">
                                        {currentUser.name}
                                        <span className="ml-1 text-xs text-blue-400">
                                            (You)
                                        </span>
                                    </span>
                                    <span className="text-xs text-zinc-400">
                                        {currentUser.role ===
                                        'teaching_assistant'
                                            ? 'Teaching Assistant'
                                            : 'Student'}
                                    </span>
                                </div>

                                {isInSession ? (
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() =>
                                                onToggleMute(currentUser.id)
                                            }
                                            className={`cursor-pointer rounded p-1.5 transition-colors ${
                                                mutedUsers.includes(
                                                    currentUser.id
                                                )
                                                    ? 'bg-red-800 hover:bg-red-700'
                                                    : 'bg-zinc-600 hover:bg-zinc-500'
                                            }`}
                                            title={
                                                mutedUsers.includes(
                                                    currentUser.id
                                                )
                                                    ? 'Unmute'
                                                    : 'Mute'
                                            }
                                        >
                                            {mutedUsers.includes(
                                                currentUser.id
                                            ) ? (
                                                <Mic
                                                    size={14}
                                                    className="text-white"
                                                />
                                            ) : (
                                                <MicOff
                                                    size={14}
                                                    className="text-white"
                                                />
                                            )}
                                        </button>

                                        <button
                                            onClick={
                                                raisedHands.includes(
                                                    currentUser.id
                                                )
                                                    ? onLowerHand
                                                    : onRaiseHand
                                            }
                                            className={`cursor-pointer rounded p-1.5 transition-colors duration-200 ${
                                                raisedHands.includes(
                                                    currentUser.id
                                                )
                                                    ? 'bg-orange-600 hover:bg-orange-700'
                                                    : 'bg-zinc-600 hover:bg-zinc-500'
                                            }`}
                                            title={
                                                raisedHands.includes(
                                                    currentUser.id
                                                )
                                                    ? 'Lower Hand'
                                                    : 'Raise Hand'
                                            }
                                        >
                                            <Hand
                                                size={14}
                                                className={`text-white ${raisedHands.includes(currentUser.id) ? 'rotate-12' : ''}`}
                                            />
                                        </button>

                                        <div ref={settingsRef}>
                                            {showSettings ===
                                                currentUser.id && (
                                                <div className="absolute top-1 right-2 z-10 overflow-auto rounded-lg border border-zinc-600 bg-zinc-700">
                                                    <button
                                                        onClick={() => {
                                                            onDisconnectFromSession();
                                                            setShowSettings(
                                                                null
                                                            );
                                                        }}
                                                        className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-sm text-zinc-200 transition-colors hover:bg-red-900 hover:text-red-300"
                                                    >
                                                        <LogOut size={14} />
                                                        Leave Session
                                                    </button>
                                                </div>
                                            )}
                                            <button
                                                onClick={() =>
                                                    setShowSettings(
                                                        showSettings ===
                                                            currentUser.id
                                                            ? null
                                                            : currentUser.id
                                                    )
                                                }
                                                className="cursor-pointer rounded bg-zinc-600 p-1.5 transition-colors hover:bg-zinc-500"
                                                title="User Settings"
                                            >
                                                <Settings
                                                    size={14}
                                                    className={`text-white transition duration-300 ${showSettings === currentUser.id ? 'rotate-90' : ''}`}
                                                />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={onLogout}
                                        className="flex cursor-pointer items-center gap-1 text-sm text-red-400 transition-colors hover:text-red-300"
                                        title="Logout"
                                    >
                                        <LogOut size={14} />
                                        Logout
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Other Users - Only show when in session */}
                    {isInSession && (
                        <div
                            className={`transition-all duration-300 ease-in-out ${
                                isMinimized
                                    ? 'max-h-0 overflow-hidden opacity-0'
                                    : 'max-h-[400px] opacity-100'
                            }`}
                        >
                            {users
                                .filter((user) => user.id !== currentUser?.id)
                                .map((user) => (
                                    <div
                                        key={user.id}
                                        className="mt-2 rounded-lg bg-zinc-800 px-3 py-2"
                                    >
                                        {/* User Control Bar: Username | Mute | Hand Raise */}
                                        <div className="flex w-full items-center justify-between gap-2">
                                            {/* Username */}
                                            <div className="flex min-w-0 flex-1 flex-col">
                                                <span className="truncate text-sm font-medium text-zinc-200">
                                                    {user.name}
                                                </span>
                                                <span className="text-xs text-zinc-400">
                                                    {user.role ===
                                                    'teaching_assistant'
                                                        ? 'Teaching Assistant'
                                                        : 'Student'}
                                                </span>
                                            </div>

                                            {/* Control Buttons (Read-only for other users) */}
                                            <div className="flex items-center gap-1">
                                                {/* Mute Status */}
                                                <div
                                                    className={`rounded p-1.5 ${
                                                        mutedUsers.includes(
                                                            user.id
                                                        )
                                                            ? 'bg-red-600'
                                                            : 'bg-zinc-600'
                                                    }`}
                                                    title={
                                                        mutedUsers.includes(
                                                            user.id
                                                        )
                                                            ? 'User is muted'
                                                            : 'User is unmuted'
                                                    }
                                                >
                                                    {mutedUsers.includes(
                                                        user.id
                                                    ) ? (
                                                        <MicOff
                                                            size={14}
                                                            className="text-white"
                                                        />
                                                    ) : (
                                                        <Mic
                                                            size={14}
                                                            className="text-white"
                                                        />
                                                    )}
                                                </div>

                                                {/* Hand Raise Status */}
                                                <div
                                                    className={`rounded p-1.5 ${
                                                        raisedHands.includes(
                                                            user.id
                                                        )
                                                            ? 'bg-orange-600'
                                                            : 'bg-zinc-600'
                                                    }`}
                                                    title={
                                                        raisedHands.includes(
                                                            user.id
                                                        )
                                                            ? 'Hand raised'
                                                            : 'Hand down'
                                                    }
                                                >
                                                    <Hand
                                                        size={14}
                                                        className={`text-white ${
                                                            raisedHands.includes(
                                                                user.id
                                                            )
                                                                ? 'rotate-12'
                                                                : ''
                                                        }`}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Minimized view - show other user count when collapsed */}
            {isInSession && isMinimized && (
                <div className="px-4 pt-1 pb-2 text-center text-xs text-zinc-400">
                    {users.filter((user) => user.id !== currentUser?.id).length}{' '}
                    other user
                    {users.filter((user) => user.id !== currentUser?.id)
                        .length !== 1
                        ? 's'
                        : ''}{' '}
                    hidden
                </div>
            )}

            {!isInSession && (
                <div className="px-4 pt-1 pb-2 text-center text-xs text-zinc-400">
                    Not in a session
                </div>
            )}
        </div>
    );
}
