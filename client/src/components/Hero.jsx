import { ArrowUpRight, X, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../utils/api';
import Login from './Login';
import Signup from './Signup';
export default function Hero() {
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [isSignup, setIsSignup] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        setIsAuthenticated(authAPI.isAuthenticated());
    }, []);

    const openLogin = () => {
        setIsSignup(false);
        setShowAuthModal(true);
    };
    const openSignup = () => {
        setIsSignup(true);
        setShowAuthModal(true);
    };
    const closeModal = () => setShowAuthModal(false);

    const goToDashboard = () => {
        navigate('/session');
    };

    const openCreateSession = () => {
        setShowCreateSession(true);
    };

    const closeCreateSession = () => {
        setShowCreateSession(false);
    };

    const handleSessionCreated = (newSession) => {
        setShowCreateSession(false);
        console.log('New session created:', newSession);
    };

    return (
        <>
            <div className="flex w-full items-center justify-between text-lg">
                <a href="" className="font-semibold">
                    Code
                    <span className="bg-gradient-to-r from-green-500 to-green-300 bg-clip-text text-transparent">
                        Mate
                    </span>
                    .
                </a>
                <ul className="flex gap-6 text-sm [&>li]:hover:text-white">
                    <li>
                        <a href="">Home</a>
                    </li>
                    <li>
                        <a href="">About</a>
                    </li>
                    <li>
                        <a href="">How it works</a>
                    </li>
                    <li>
                        <a href="">Technology</a>
                    </li>
                    <li>
                        <a href="">FAQ</a>
                    </li>
                </ul>
                {isAuthenticated ? (
                    <div className="flex gap-3">
                        <button
                            className="flex cursor-pointer items-center gap-1 bg-blue-600 px-3 py-1 transition-colors duration-200 hover:bg-blue-700"
                            onClick={goToDashboard}
                        >
                            Go to Dashboard <ArrowUpRight />
                        </button>
                    </div>
                ) : (
                    <button
                        className="flex cursor-pointer items-center gap-1 bg-green-600 px-3 py-1 transition-colors duration-200 hover:bg-green-700"
                        onClick={openLogin}
                    >
                        Get Started <ArrowUpRight />
                    </button>
                )}
            </div>
            {showAuthModal && (
                <div className="absolute inset-0 flex flex-1 flex-col items-center justify-center gap-6 bg-gray-900/80">
                    <div className="relative w-1/4 bg-gray-100 px-5 py-4 text-gray-800">
                        <button
                            onClick={closeModal}
                            className="absolute -top-3 -right-3 cursor-pointer rounded-full border bg-gray-100 p-1 text-gray-800 transition-transform duration-300 hover:rotate-90 hover:text-gray-700"
                        >
                            <X size={20} />
                        </button>
                        <div className="flex flex-col gap-6">
                            {isSignup ? (
                                <>
                                    <Signup
                                        onSwitchToLogin={openLogin}
                                        onRegistrationSuccess={goToDashboard}
                                    />
                                </>
                            ) : (
                                <>
                                    <h1 className="text-lg tracking-wide">
                                        Login to Your CodeMate Account
                                    </h1>
                                    <Login />
                                    <p className="text-sm">
                                        Don't have an Account?{' '}
                                        <button
                                            onClick={openSignup}
                                            className="cursor-pointer text-green-800 hover:text-green-700"
                                        >
                                            SignUp
                                        </button>
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
