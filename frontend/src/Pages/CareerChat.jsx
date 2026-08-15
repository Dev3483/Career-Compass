import React, { useState, useEffect, useRef } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, User as UserIcon, MessageSquare, Lightbulb, Clock, Plus, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";
import { sendCareerChatMessage, getCareerChatHistory } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

const suggestions = [
    "What careers are good for someone with strong analytical skills?",
    "I have a degree in Commerce. What jobs should I consider?",
    "What skills do I need to become a Data Scientist?",
    "Tell me about careers in AI and Machine Learning",
    "Based on my resume, what career path should I pursue?",
    "How can I transition into a tech career?"
];

export default function CareerChat() {
    const { user, isAuthenticated, isLoadingAuth, navigateToLogin } = useAuth();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]); 
    
    // ✨ Sidebar and History Control States
    const [isViewingHistory, setIsViewingHistory] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const chatRef = useRef(null);

    useEffect(() => {
        if (isAuthenticated && user?.user_id) {
            fetchHistory();
        }
    }, [isAuthenticated, user]);

    const fetchHistory = async () => {
        try {
            const res = await getCareerChatHistory(user.user_id);
            if (res.history) {
                setHistory(res.history);
            }
        } catch (error) {
            console.error("Failed to fetch history", error);
        }
    };

    useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
    }, [messages]);

    // ✨ FIXED: Clears UI immediately, shows new chat prompt, resets backend
    const handleNewChat = async () => {
        setIsViewingHistory(false);
        // Instantly refresh the UI
        setMessages([{ role: "assistant", content: "✅ Session wiped! Ready for a brand new prediction. What is your background?" }]);
        setLoading(true);
        try {
            await sendCareerChatMessage("reset", user.user_id, []);
        } catch (error) {
            console.error("Failed to reset backend state", error);
            toast.error("Failed to start new chat.");
        }
        setLoading(false);
    };

    const viewHistoryChat = (historyItem) => {
        if (historyItem.chat_transcript) {
            try {
                const parsedTranscript = JSON.parse(historyItem.chat_transcript);
                setMessages(parsedTranscript);
                setIsViewingHistory(true);
                // Collapse sidebar on small screens
                if (window.innerWidth < 1024) {
                    setIsSidebarOpen(false);
                }
            } catch (e) {
                console.error("Failed to parse transcript json", e);
                toast.error("Failed to load this chat.");
            }
        } else {
            toast.error("No transcript available for this older chat.");
        }
    };

    const sendMessage = async (text) => {
        const msg = text || input.trim();
        if (!msg || loading || isViewingHistory) return;

        if (!isAuthenticated || !user) {
            toast.error("Please log in to use the career chat");
            navigateToLogin();
            return;
        }

        setInput("");

        const newMessages = [...messages, { role: "user", content: msg }];
        setMessages(newMessages);
        setLoading(true);

        try {
            const res = await sendCareerChatMessage(msg, user.user_id, newMessages);
            let botReply = "";

            if (res.reply && !res.recommendations) {
                botReply = res.reply;
            }

            if (res.recommendations) {
                const careers = res.recommendations
                    .map(r => `• **${r.career}**: ${r.confidence}% match`)
                    .join("\n");

                botReply = `\n${res.reply || "Based on your profile, here are the best career matches:"}\n\n### 🎯 Recommended Careers\n${careers}\n\n${res.ai_analysis || ""}`;
                fetchHistory(); 
            }

            setMessages([...newMessages, { role: "assistant", content: botReply }]);
        } catch (error) {
            console.error("Chat error:", error);
            const errorMsg = error.error || "Server error. Please try again.";
            toast.error(errorMsg);
            setMessages([...newMessages, { role: "assistant", content: `⚠️ ${errorMsg}` }]);
        }
        setLoading(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    if (isLoadingAuth) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <div className="flex gap-1">
                    <div className="w-3 h-3 rounded-full bg-[#6C63FF] pulse-dot" />
                    <div className="w-3 h-3 rounded-full bg-[#6C63FF] pulse-dot" style={{ animationDelay: "0.2s" }} />
                    <div className="w-3 h-3 rounded-full bg-[#6C63FF] pulse-dot" style={{ animationDelay: "0.4s" }} />
                </div>
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <div className="text-center max-w-md mx-4">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                        <MessageSquare className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Authentication Required</h3>
                    <p className="text-gray-500 mb-6">
                        Please log in to access the Career AI Advisor and get personalized career recommendations.
                    </p>
                    <Button onClick={navigateToLogin} className="bg-[#6C63FF] text-white hover:bg-[#5A52D5]">
                        Log In
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <DashboardShell user={user} title="Career AI Chatbot" currentPage="CareerChat">
            {/* ✨ Layout container for Collapsible Sidebar + Main Area */}
            <div className="flex h-[calc(100vh-8rem)] overflow-hidden">
                
                {/* ✨ Collapsible Sidebar */}
                <div 
                    className={`hidden lg:flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm transition-all duration-300 ease-in-out overflow-hidden z-10 ${
                        isSidebarOpen ? 'w-80 opacity-100 mr-6' : 'w-0 opacity-0 border-none mr-0'
                    }`}
                >
                    <div className="w-80 flex flex-col h-full">
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                                    <Clock className="w-4 h-4 text-[#6C63FF]" />
                                </div>
                                <h2 className="font-semibold text-gray-800">History</h2>
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {history.length === 0 ? (
                                <div className="text-center mt-10">
                                    <Clock className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                                    <p className="text-sm text-gray-500 px-4">No past predictions yet. Complete a session to see history!</p>
                                </div>
                            ) : (
                                history.map((item, idx) => (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        key={item.id || idx} 
                                        onClick={() => viewHistoryChat(item)}
                                        className="p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-purple-50 hover:border-purple-100 transition-all cursor-pointer group"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-semibold text-sm text-gray-900 line-clamp-1 pr-2">{item.top_prediction}</h4>
                                            <span className="text-xs font-bold text-[#6C63FF] bg-purple-100 px-2 py-1 rounded-md shrink-0">
                                                {item.confidence}%
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mb-2 truncate">{item.domain} • {item.education_level}</p>
                                        <div className="flex justify-between items-center text-[10px] text-gray-400">
                                            <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm relative transition-all duration-300">
                    
                    {/* Top Action Bar (Includes Hamburger Icon) */}
                    <div className="h-14 border-b border-gray-100 bg-white flex items-center px-4 shrink-0 z-20 justify-between">
                        <div className="flex items-center gap-3">
                            {/* ✨ Sidebar Toggle Button */}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="text-gray-400 hover:text-[#6C63FF] hover:bg-purple-50 hidden lg:flex h-8 w-8"
                                title={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
                            >
                                <Menu className="w-5 h-5" />
                            </Button>
                            <span className="font-semibold text-sm text-gray-700">
                                {isViewingHistory ? "Viewing Past Chat" : "Career Chat"}
                            </span>
                        </div>
                        
                        <Button 
                            onClick={handleNewChat} 
                            size="sm" 
                            variant="ghost"
                            className="h-8 text-[#6C63FF] hover:bg-purple-50"
                        >
                            <Plus className="w-4 h-4 mr-1" /> New Chat
                        </Button>
                    </div>

                    {isViewingHistory && (
                        <div className="bg-amber-50 border-b border-amber-100 p-2 text-center text-xs text-amber-700 z-10 font-medium shrink-0">
                            You are viewing a past conversation. Click "New Chat" to start a fresh prediction.
                        </div>
                    )}

                    <div ref={chatRef} className="flex-1 overflow-y-auto p-6 space-y-4">
                        {messages.length === 0 && !loading && (
                            <div className="text-center py-16">
                                <div className="w-16 h-16 rounded-2xl bg-[#6C63FF] flex items-center justify-center mx-auto mb-4 shadow-md shadow-indigo-100">
                                    <MessageSquare className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Career AI Advisor</h3>
                                <p className="text-gray-500 mb-4 max-w-md mx-auto">
                                    Hi {user?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there'}! I'm your AI career advisor.
                                </p>
                                <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
                                    {suggestions.map((s, i) => (
                                        <motion.button
                                            key={i}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            onClick={() => sendMessage(s)}
                                            className="px-4 py-2.5 rounded-xl bg-purple-50 text-[#6C63FF] text-sm font-medium hover:bg-purple-100 transition-colors flex items-center gap-2"
                                        >
                                            <Lightbulb className="w-3.5 h-3.5" />
                                            {s}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <AnimatePresence>
                            {messages.map((msg, i) => (
                                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                                    {msg.role === "assistant" && (
                                        <div className="w-8 h-8 rounded-lg bg-[#6C63FF] flex items-center justify-center flex-shrink-0 mt-1 shadow-sm shadow-indigo-100">
                                            <Sparkles className="w-4 h-4 text-white" />
                                        </div>
                                    )}
                                    <div className={`max-w-[75%] rounded-2xl px-5 py-3.5 ${msg.role === "user" ? "bg-[#6C63FF] text-white shadow-md shadow-indigo-100/50" : "bg-gray-50 border border-gray-100 text-gray-800"}`}>
                                        <div className="text-sm leading-relaxed prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0">
                                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                                        </div>
                                    </div>
                                    {msg.role === "user" && (
                                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 mt-1">
                                            <UserIcon className="w-4 h-4 text-gray-500" />
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {loading && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                                <div className="w-8 h-8 rounded-lg bg-[#6C63FF] flex items-center justify-center flex-shrink-0 mt-1 shadow-sm shadow-indigo-100">
                                    <Sparkles className="w-4 h-4 text-white" />
                                </div>
                                <div className="bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4">
                                    <div className="flex gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" />
                                        <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0.2s" }} />
                                        <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0.4s" }} />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="border-t border-gray-100 p-4 bg-gray-50/50 shrink-0">
                        <div className="flex gap-3 items-end">
                            <Textarea
                                placeholder={isViewingHistory ? "Viewing Past Chat (Click New Chat to restart)..." : "Ask me anything about your career..."}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={isViewingHistory}
                                rows={1}
                                className={`rounded-xl resize-none min-h-[50px] max-h-32 border-gray-200 focus-visible:ring-[#6C63FF] focus-visible:ring-offset-0 ${isViewingHistory ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white'}`}
                            />
                            <Button
                                onClick={() => sendMessage()}
                                disabled={!input.trim() || loading || isViewingHistory}
                                className="bg-[#6C63FF] text-white rounded-xl h-[50px] w-[50px] p-0 hover:bg-[#5A52D5] shadow-md shadow-indigo-200 shrink-0"
                            >
                                <Send className="w-5 h-5 ml-1" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardShell>
    );
}