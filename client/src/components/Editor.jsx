import { useState, useEffect, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { ChevronDown, SquareArrowRight, SquareMinus, Save } from 'lucide-react';
import { sessionAPI } from '../utils/api';

export default function Editor({
    currentSession,
    roomId,
    socket,
    currentUser,
}) {
    const [code, setCode] = useState('');
    const [output, setOutput] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState('Python');
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState('');
    const [codeByLanguage, setCodeByLanguage] = useState({});
    const isRemoteChange = useRef(false);

    const languages = [
        {
            name: 'Python',
            extension: python(),
            defaultCode:
                '# Write your Python code here\nprint("Hello, World!")',
        },
        {
            name: 'Javascript',
            extension: javascript({ jsx: true }),
            defaultCode:
                '// Write your JavaScript code here\nconsole.log("Hello, World!");',
        },
        {
            name: 'Java',
            extension: java(),
            defaultCode:
                '// Write your Java code here\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}',
        },
    ];

    // Load code from localStorage on component mount, using roomId for session-specific storage
    useEffect(() => {
        const storageKey = roomId
            ? `codemate-editor-content-${roomId}`
            : 'codemate-editor-content';
        const languageKey = roomId
            ? `codemate-editor-language-${roomId}`
            : 'codemate-editor-language';
        const codeByLanguageKey = roomId
            ? `codemate-editor-by-language-${roomId}`
            : 'codemate-editor-by-language';

        const savedCode = localStorage.getItem(storageKey);
        const savedLanguage = localStorage.getItem(languageKey);
        const savedCodeByLanguage = localStorage.getItem(codeByLanguageKey);

        let parsedCodeByLanguage = {};
        if (savedCodeByLanguage) {
            try {
                parsedCodeByLanguage = JSON.parse(savedCodeByLanguage);
            } catch (error) {
                console.error('Error parsing saved code by language:', error);
            }
        }
        setCodeByLanguage(parsedCodeByLanguage);

        if (savedLanguage) {
            setSelectedLanguage(savedLanguage);
            const languageCode = parsedCodeByLanguage[savedLanguage];
            if (languageCode) {
                setCode(languageCode);
            } else {
                const defaultCode = getDefaultCodeForLanguage(savedLanguage);
                setCode(defaultCode);
                parsedCodeByLanguage[savedLanguage] = defaultCode;
                setCodeByLanguage(parsedCodeByLanguage);
            }
        } else if (currentSession?.language) {
            const sessionLang =
                currentSession.language.charAt(0).toUpperCase() +
                currentSession.language.slice(1);
            setSelectedLanguage(sessionLang);
            const languageCode = parsedCodeByLanguage[sessionLang];
            if (languageCode) {
                setCode(languageCode);
            } else {
                const defaultCode = getDefaultCodeForLanguage(sessionLang);
                setCode(defaultCode);
                parsedCodeByLanguage[sessionLang] = defaultCode;
                setCodeByLanguage(parsedCodeByLanguage);
            }
        } else {
            const defaultLang = 'Python';
            const languageCode = parsedCodeByLanguage[defaultLang];
            if (languageCode) {
                setCode(languageCode);
            } else {
                const defaultCode = getDefaultCodeForLanguage(defaultLang);
                setCode(defaultCode);
                parsedCodeByLanguage[defaultLang] = defaultCode;
                setCodeByLanguage(parsedCodeByLanguage);
            }
        }
    }, [roomId, currentSession]);

    // Socket listeners for real-time code synchronization
    useEffect(() => {
        if (!socket || !roomId) {
            console.log('Socket or roomId not available:', {
                socket: !!socket,
                roomId,
            });
            return;
        }

        // Listen for code updates from other users
        const handleCodeUpdate = ({ code: newCode, userId }) => {
            console.log(
                'Received code update from user:',
                userId,
                'Current user:',
                currentUser?.id
            );

            // Don't update if the change came from this user
            if (currentUser && userId === currentUser.id) {
                console.log('Ignoring own code update');
                return;
            }

            console.log('Applying code update');
            // Set flag to prevent re-emitting
            isRemoteChange.current = true;

            setCode(newCode);

            // Update code by language storage
            setCodeByLanguage((prev) => ({
                ...prev,
                [selectedLanguage]: newCode,
            }));

            // Update localStorage
            const storageKey = roomId
                ? `codemate-editor-content-${roomId}`
                : 'codemate-editor-content';
            const codeByLanguageKey = roomId
                ? `codemate-editor-by-language-${roomId}`
                : 'codemate-editor-by-language';

            localStorage.setItem(storageKey, newCode);
            localStorage.setItem(
                codeByLanguageKey,
                JSON.stringify({
                    ...codeByLanguage,
                    [selectedLanguage]: newCode,
                })
            );
        };

        // Listen for language updates from other users
        const handleLanguageUpdate = ({ language, userId }) => {
            console.log(
                'Received language update:',
                language,
                'from user:',
                userId
            );

            // Don't update if the change came from this user
            if (currentUser && userId === currentUser.id) {
                console.log('Ignoring own language update');
                return;
            }

            console.log('Applying language update');
            // Capitalize first letter to match our format
            const formattedLanguage =
                language.charAt(0).toUpperCase() + language.slice(1);

            isRemoteChange.current = true;
            setSelectedLanguage(formattedLanguage);

            // Update localStorage
            const languageKey = roomId
                ? `codemate-editor-language-${roomId}`
                : 'codemate-editor-language';
            localStorage.setItem(languageKey, formattedLanguage);

            // Switch to the code for this language
            const saved = codeByLanguage[formattedLanguage];
            if (saved) {
                setCode(saved);
            } else {
                const defaultCode =
                    getDefaultCodeForLanguage(formattedLanguage);
                setCode(defaultCode);
            }
        };

        socket.on('code-update', handleCodeUpdate);
        socket.on('language-update', handleLanguageUpdate);

        return () => {
            socket.off('code-update', handleCodeUpdate);
            socket.off('language-update', handleLanguageUpdate);
        };
    }, [socket, roomId, currentUser, selectedLanguage, codeByLanguage]);

    const onChange = (value) => {
        setCode(value);
        setHasUnsavedChanges(true);

        const updatedCodeByLanguage = {
            ...codeByLanguage,
            [selectedLanguage]: value,
        };
        setCodeByLanguage(updatedCodeByLanguage);

        const storageKey = roomId
            ? `codemate-editor-content-${roomId}`
            : 'codemate-editor-content';
        const codeByLanguageKey = roomId
            ? `codemate-editor-by-language-${roomId}`
            : 'codemate-editor-by-language';

        localStorage.setItem(storageKey, value);
        localStorage.setItem(
            codeByLanguageKey,
            JSON.stringify(updatedCodeByLanguage)
        );

        // Emit code change to other users via socket (only if not a remote change)
        if (socket && roomId && currentUser && !isRemoteChange.current) {
            console.log(
                'Emitting code change to room:',
                roomId,
                'from user:',
                currentUser.id
            );
            socket.emit('code-change', {
                roomId,
                code: value,
                userId: currentUser.id,
            });
        } else {
            console.log('Not emitting code change:', {
                hasSocket: !!socket,
                hasRoomId: !!roomId,
                hasCurrentUser: !!currentUser,
                isRemoteChange: isRemoteChange.current,
            });
        }

        // Reset the remote change flag
        if (isRemoteChange.current) {
            isRemoteChange.current = false;
        }
    };

    const handleLanguageChange = async (language) => {
        setSelectedLanguage(language);
        setIsDropdownOpen(false);

        const languageKey = roomId
            ? `codemate-editor-language-${roomId}`
            : 'codemate-editor-language';
        localStorage.setItem(languageKey, language);

        if (roomId) {
            try {
                await sessionAPI.updateSessionLanguage(
                    roomId,
                    language.toLowerCase()
                );
            } catch (error) {
                console.error('Failed to update session language:', error);
            }
        }

        // Emit language change to other users via socket (only if not a remote change)
        if (socket && roomId && currentUser && !isRemoteChange.current) {
            socket.emit('language-change', {
                roomId,
                language: language.toLowerCase(),
                userId: currentUser.id,
            });
        }

        // Reset the remote change flag
        if (isRemoteChange.current) {
            isRemoteChange.current = false;
        }

        // Check if we have stored code for this language
        const saved = codeByLanguage[language];
        if (saved) {
            setCode(saved);
        } else {
            const defaultCode = getDefaultCodeForLanguage(language);
            setCode(defaultCode);
            const updatedCodeByLanguage = {
                ...codeByLanguage,
                [language]: defaultCode,
            };
            setCodeByLanguage(updatedCodeByLanguage);

            const codeByLanguageKey = roomId
                ? `codemate-editor-by-language-${roomId}`
                : 'codemate-editor-by-language';
            localStorage.setItem(
                codeByLanguageKey,
                JSON.stringify(updatedCodeByLanguage)
            );
        }

        const storageKey = roomId
            ? `codemate-editor-content-${roomId}`
            : 'codemate-editor-content';
        localStorage.setItem(storageKey, code);
    };

    const getDefaultCodeForLanguage = (languageName) => {
        const lang = languages.find((l) => l.name === languageName);
        return lang ? lang.defaultCode : languages[0].defaultCode;
    };

    const getCurrentLanguageExtension = () => {
        const lang = languages.find((l) => l.name === selectedLanguage);
        return lang ? lang.extension : languages[0].extension;
    };

    const saveCode = async () => {
        if (!roomId) {
            setSaveStatus('No active session');
            setTimeout(() => setSaveStatus(''), 2000);
            return;
        }

        setIsSaving(true);
        try {
            // Save only the current language's code to the database
            const currentLanguageCode = code; // This is the currently active code
            await sessionAPI.saveCode(roomId, currentLanguageCode);
            setHasUnsavedChanges(false);
            setSaveStatus('Saved');
            setTimeout(() => setSaveStatus(''), 2000);
        } catch (error) {
            setSaveStatus('Save failed');
            setTimeout(() => setSaveStatus(''), 2000);
            console.error('Failed to save code:', error);
        } finally {
            setIsSaving(false);
        }
    };

    useEffect(() => {
        const handleKeyDown = (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 's') {
                event.preventDefault();
                saveCode();
            }
            if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                event.preventDefault();
                runCodeImproved();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [code, roomId]);

    const [isRunning, setIsRunning] = useState(false);
    const [executionTime, setExecutionTime] = useState(null);
    const [showOutput, setShowOutput] = useState(true);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    const runCodeImproved = async () => {
        setIsRunning(true);
        setShowOutput(true);
        const startTime = performance.now();

        try {
            let result = '';

            if (selectedLanguage === 'Javascript') {
                const logMessages = [];
                const originalLog = console.log;
                console.log = (...args) => {
                    logMessages.push(args.join(' '));
                    originalLog(...args);
                };

                await new Promise((resolve) => {
                    setTimeout(() => {
                        new Function(code)();
                        resolve();
                    }, 0);
                });

                console.log = originalLog;
                result = logMessages.join('\n') || 'Code executed successfully';
            } else if (selectedLanguage === 'Python') {
                const printStatements = [];
                const lines = code.split('\n');

                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (trimmedLine.startsWith('print(')) {
                        const match = trimmedLine.match(
                            /print\s*\(\s*["']([^"']*)["']\s*\)/
                        );
                        if (match) {
                            printStatements.push(match[1]);
                        } else {
                            const complexMatch = trimmedLine.match(
                                /print\s*\(\s*([^)]+)\s*\)/
                            );
                            if (complexMatch) {
                                let content = complexMatch[1].trim();
                                if (
                                    content.startsWith('"') &&
                                    content.endsWith('"')
                                ) {
                                    content = content.slice(1, -1);
                                } else if (
                                    content.startsWith("'") &&
                                    content.endsWith("'")
                                ) {
                                    content = content.slice(1, -1);
                                }
                                printStatements.push(content);
                            }
                        }
                    }
                }

                if (printStatements.length > 0) {
                    result = printStatements.join('\n');
                } else {
                    result =
                        'Python code simulated (browser environment)\nNote: For full Python execution, a server-side executor is needed.';
                }
            } else if (selectedLanguage === 'Java') {
                const printStatements = [];
                const lines = code.split('\n');

                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (trimmedLine.includes('System.out.println(')) {
                        const match = trimmedLine.match(
                            /System\.out\.println\s*\(\s*["']([^"']*)["']\s*\)/
                        );
                        if (match) {
                            printStatements.push(match[1]);
                        }
                    }
                }

                if (printStatements.length > 0) {
                    result = printStatements.join('\n');
                } else {
                    result =
                        'Java code simulated (browser environment)\nNote: For full Java execution, a server-side executor is needed.';
                }
            }

            const endTime = performance.now();
            setExecutionTime(Math.round(endTime - startTime));
            setOutput(result);
        } catch (error) {
            setOutput('Error: ' + error.message);
            setExecutionTime(null);
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div className="flex h-full flex-col overflow-hidden">
            <div className="flex min-h-0 flex-1 flex-col">
                <div className="my-2 flex-shrink-0 bg-zinc-800 px-4 py-2">
                    <div className="relative inline-block">
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex min-w-32 cursor-pointer items-center justify-between gap-2 rounded bg-zinc-700 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-600"
                        >
                            {selectedLanguage}
                            <ChevronDown size={16} />
                        </button>
                        {isDropdownOpen && (
                            <div className="absolute top-full left-0 z-20 mt-1 min-w-32 rounded bg-zinc-700">
                                {languages.map((language) => (
                                    <button
                                        key={language.name}
                                        onClick={() =>
                                            handleLanguageChange(language.name)
                                        }
                                        className="block w-full cursor-pointer px-3 py-2 text-left text-sm text-zinc-300 first:rounded-t last:rounded-b hover:bg-zinc-600"
                                    >
                                        {language.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <div className="relative min-h-0 flex-1">
                    <CodeMirror
                        key={selectedLanguage}
                        value={code}
                        theme="light"
                        extensions={[getCurrentLanguageExtension()]}
                        onChange={onChange}
                        className="h-full border-t border-gray-700 text-zinc-950 [&_.cm-editor]:h-full [&_.cm-scroller]:h-full [&>div]:h-full"
                    />
                    <div className="absolute top-0 right-0 z-10 flex w-auto min-w-fit items-center gap-2 rounded-bl-lg bg-zinc-800 px-3 pb-2">
                        <button
                            onClick={saveCode}
                            disabled={isSaving || !roomId}
                            className={`flex cursor-pointer items-center gap-2 rounded px-3 py-1.5 text-sm whitespace-nowrap transition-colors disabled:cursor-not-allowed ${
                                hasUnsavedChanges && roomId
                                    ? 'bg-orange-700 hover:bg-orange-600'
                                    : 'bg-blue-700 hover:bg-blue-600 disabled:bg-gray-600'
                            }`}
                            title={
                                !roomId
                                    ? 'No active session'
                                    : hasUnsavedChanges
                                      ? 'Unsaved changes (Ctrl+S)'
                                      : 'Save code to database (Ctrl+S)'
                            }
                        >
                            {isSaving
                                ? 'Saving'
                                : hasUnsavedChanges
                                  ? 'Save*'
                                  : 'Save'}
                            <Save size={16} />
                        </button>
                        <button
                            onClick={runCodeImproved}
                            disabled={isRunning}
                            className="flex cursor-pointer items-center gap-2 rounded bg-green-700 px-3 py-1.5 text-sm whitespace-nowrap transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-green-800"
                            title="Run code (Ctrl+Enter)"
                        >
                            {isRunning ? 'Running...' : 'Run'}
                            <SquareArrowRight size={18} />
                        </button>
                        <div className="flex flex-col items-end">
                            <span className="text-sm whitespace-nowrap text-zinc-300">
                                {saveStatus ? (
                                    <span className="text-green-400">
                                        {saveStatus}
                                    </span>
                                ) : isRunning ? (
                                    '...'
                                ) : executionTime ? (
                                    `${executionTime}ms`
                                ) : (
                                    'Ready'
                                )}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {showOutput && (
                <div className="max-h-64 flex-shrink-0 bg-zinc-800 pl-6">
                    <div className="flex items-center justify-between bg-zinc-800 py-2">
                        <span className="font-medium text-zinc-300">
                            Output
                        </span>
                        <button
                            onClick={() => setShowOutput(false)}
                            className="mr-2 cursor-pointer rounded p-1 transition-colors hover:bg-zinc-700"
                        >
                            <SquareMinus size={20} />
                        </button>
                    </div>
                    <div className="h-48 overflow-y-auto rounded-tl bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-50">
                        <pre className="pt-1 whitespace-pre-wrap">
                            {output || 'No output'}
                        </pre>
                    </div>
                </div>
            )}

            {!showOutput && (
                <div className="flex-shrink-0">
                    <button
                        onClick={() => setShowOutput(true)}
                        className="w-full cursor-pointer border-t border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-700"
                    >
                        Show Output
                    </button>
                </div>
            )}
        </div>
    );
}
