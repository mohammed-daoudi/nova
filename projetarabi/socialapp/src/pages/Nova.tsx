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

/* Teapot "Berrad" SVG logo for L'BERRAD AI */
const BerradLogo = ({ size = 20 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 11h16a8 8 0 0 1 0 16H5V11Z" fill="white" opacity="0.95" />
        <path d="M21 15c3 0 6 1.5 6 4s-3 4-6 4" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <path d="M9 11V8a3 3 0 0 1 6 0v3" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <rect x="7" y="26" width="12" height="2" rx="1" fill="white" opacity="0.75" />
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
                        <BerradLogo size={22} />
                    </div>
                    <div className="nova-header-info">
                        <h2>L'BERRAD <span className="nova-badge">AI</span></h2>
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
                                    <BerradLogo size={38} />
                                </div>
                            </div>
                            <h3>Marhba! L'Berrad rah msh77er w 3amr  .</h3>
                            <p>Marhba! L'Berrad is ready. Let's talk over some tea.</p>
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
                                            <BerradLogo size={14} />
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
                                        <BerradLogo size={14} />
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
                        placeholder="Ask L'Berrad anything..."
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