import { useState, useRef, useEffect } from "react";
import "./Nova.css";

interface Message {
    role: "user" | "assistant";
    content: string;
    time: string;
}

const SUGGESTIONS = [
    { icon: "✍️", text: "Write a caption for my photo" },
    { icon: "👋", text: "Icebreaker for a new friend" },
    { icon: "📝", text: "Polish my profile bio" },
    { icon: "💬", text: "Help me draft a message" },
];

const NovaLogo = ({ size = 20 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="10" r="5" fill="white" opacity="0.95" />
        <circle cx="8" cy="19" r="3.5" fill="white" opacity="0.7" />
        <circle cx="20" cy="19" r="3.5" fill="white" opacity="0.7" />
        <line x1="14" y1="15" x2="8" y2="19" stroke="white" strokeWidth="1.5" opacity="0.5" />
        <line x1="14" y1="15" x2="20" y2="19" stroke="white" strokeWidth="1.5" opacity="0.5" />
    </svg>
);

const getTime = () =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export default function Nova() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    useEffect(() => {
        if (!loading) {
            textareaRef.current?.focus();
        }
    }, [loading]);

    const handleSend = async (text?: string) => {
        const content = (text || input).trim();
        if (!content || loading) return;

        const userMessage: Message = { role: "user", content, time: getTime() };
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setInput("");
        setLoading(true);
        if (textareaRef.current) textareaRef.current.style.height = "42px";
        setTimeout(() => textareaRef.current?.focus(), 0);

        try {
            const token = localStorage.getItem("token");
            const API_BASE = import.meta.env.VITE_API_URL || ''
            const res = await fetch(`${API_BASE}/api/nova`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    messages: updatedMessages.map((m) => ({
                        role: m.role,
                        content: m.content,
                    })),
                }),
            });

            const data = await res.json();
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: data.reply || "Sorry, I couldn't respond right now.",
                    time: getTime(),
                },
            ]);
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: "Something went wrong. Please try again.",
                    time: getTime(),
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
        e.target.style.height = "42px";
        e.target.style.height = `${e.target.scrollHeight}px`;
    };

    return (
        <div className="nova-page">
            <div className="nova-card">

                {/* Header */}
                <div className="nova-header">
                    <div className="nova-logo">
                        <NovaLogo size={22} />
                    </div>
                    <div className="nova-header-info">
                        <h2>Nova <span className="nova-badge">AI</span></h2>
                        <p>Always online</p>
                    </div>
                    {messages.length > 0 && (
                        <button className="nova-clear-btn" onClick={() => setMessages([])}>
                            Clear chat
                        </button>
                    )}
                </div>

                {/* Messages */}
                <div className="nova-messages">
                    {messages.length === 0 ? (
                        <div className="nova-welcome">
                            <div className="nova-glow-ring">
                                <div className="nova-welcome-logo">
                                    <NovaLogo size={38} />
                                </div>
                            </div>
                            <h3>Hey, I'm Nova</h3>
                            <p>Your AI companion on Vibe. Ask me anything or pick something below.</p>
                            <div className="nova-suggestions">
                                {SUGGESTIONS.map((s) => (
                                    <button
                                        key={s.text}
                                        className="nova-suggestion-btn"
                                        onClick={() => handleSend(s.text)}
                                    >
                                        <span className="nova-suggestion-icon">{s.icon}</span>
                                        {s.text}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <>
                            {messages.map((msg, i) => (
                                <div
                                    key={i}
                                    className={`nova-message-row ${msg.role === "user" ? "user" : ""}`}
                                >
                                    {msg.role === "assistant" && (
                                        <div className="nova-avatar">
                                            <NovaLogo size={14} />
                                        </div>
                                    )}
                                    <div>
                                        <div className={`nova-bubble ${msg.role === "user" ? "user" : "ai"}`}>
                                            {msg.content}
                                        </div>
                                        <div className="nova-bubble-time">{msg.time}</div>
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="nova-message-row">
                                    <div className="nova-avatar">
                                        <NovaLogo size={14} />
                                    </div>
                                    <div className="nova-typing">
                                        <span /><span /><span />
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                    <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="nova-input-area">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={handleTextareaChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask Nova anything..."
                        rows={1}
                        disabled={loading}
                    />
                    <button
                        className="nova-send-btn"
                        onClick={() => handleSend()}
                        disabled={!input.trim() || loading}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>

            </div>
        </div>
    );
}