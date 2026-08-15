import React, { useState, useEffect, useRef } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { motion } from "framer-motion";
import { Mic, MicOff, Timer, Brain, CheckCircle, Star, RefreshCw, Send, PlayCircle, ClipboardList, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { evaluateInterviewAnswer } from "@/utils/api"; 

// Mock user data
const mockUser = {
    id: "user-1",
    full_name: "John Doe",
    email: "john.doe@example.com",
    role: "job_seeker"
};

// Mock questions by role
const mockQuestions = {
    frontend: [
        "How does the virtual DOM work in React, and why is it faster?",
        "What are React hooks and why were they introduced?",
        "How would you optimize a React application for maximum performance?"
    ],
    backend: [
        "What is the difference between SQL and NoSQL databases?",
        "How would you handle authentication and authorization in a Node.js application?",
        "Explain the concept of middleware in Express."
    ],
    fullstack: [
        "How do you manage state in a full-stack application?",
        "How would you implement real-time features like chat in a web app?",
        "Explain the MERN stack architecture and data flow."
    ],
    data_science: [
        "Explain the bias-variance tradeoff in machine learning.",
        "How would you handle missing or corrupted data in a massive dataset?",
        "Explain cross-validation and why it's important."
    ],
    product: [
        "How do you prioritize features for a product roadmap?",
        "Explain how you would validate a brand new product idea.",
        "How do you handle severe stakeholder disagreements?"
    ]
};

// Simulates an LLM generating the next question based on context
const generateNextAdaptiveQuestion = async (lastAnswer, currentRole, questionNumber) => {
    await new Promise(res => setTimeout(res, 800)); // Simulate API delay
    const lowerAns = lastAnswer.toLowerCase();
    
    // Adaptive logic for Question 2 (following up on "Tell me about yourself")
    if (questionNumber === 2) {
        if (lowerAns.includes("project") || lowerAns.includes("built") || lowerAns.includes("developed")) {
            return "You mentioned working on some projects. Could you dive deeper into one specific project you are most proud of? What challenges did you face and how did you overcome them?";
        } else if (lowerAns.includes("student") || lowerAns.includes("university") || lowerAns.includes("college")) {
            return "Given your academic background, what was the most complex technical concept you've had to learn recently, and how did you apply it practically?";
        } else {
            return "That's interesting. What would you say is your strongest technical skill right now, and how have you applied it recently?";
        }
    }
    
    // Fallback to random role-based technical questions for questions 3 and 4
    const questions = mockQuestions[currentRole] || mockQuestions.frontend;
    return questions[Math.floor(Math.random() * questions.length)];
};

const TOTAL_QUESTIONS = 4;

export default function InterviewPrep() {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState("frontend");
    
    // Phase states: "setup" | "active" | "completed"
    const [phase, setPhase] = useState("setup");
    
    // Interview Progress States
    const [currentQIndex, setCurrentQIndex] = useState(1);
    const [currentQ, setCurrentQ] = useState("");
    const [answer, setAnswer] = useState("");
    const [history, setHistory] = useState([]); // Stores { question, answer, feedback, score }
    
    const [loading, setLoading] = useState(false);
    const [seconds, setSeconds] = useState(0);
    const [timerActive, setTimerActive] = useState(false);

    // Speech Recognition State
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef(null);

    useEffect(() => {
        setTimeout(() => setUser(mockUser), 500);

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;

            recognitionRef.current.onresult = (event) => {
                let currentTranscript = '';
                for (let i = 0; i < event.results.length; i++) {
                    currentTranscript += event.results[i][0].transcript;
                }
                setAnswer(currentTranscript);
            };

            recognitionRef.current.onerror = (event) => {
                console.error("Speech recognition error", event.error);
                setIsRecording(false);
            };
        }
        
        return () => {
            if (recognitionRef.current) recognitionRef.current.stop();
        };
    }, []);

    useEffect(() => {
        let interval;
        if (timerActive) {
            interval = setInterval(() => setSeconds(s => s + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [timerActive]);

    const toggleRecording = () => {
        if (!recognitionRef.current) {
            alert("Your browser does not support voice recording.");
            return;
        }

        if (isRecording) {
            recognitionRef.current.stop();
            setIsRecording(false);
        } else {
            if (!answer) setAnswer(""); 
            recognitionRef.current.start();
            setIsRecording(true);
        }
    };

    const startInterview = () => {
        setPhase("active");
        setCurrentQIndex(1);
        setHistory([]);
        setCurrentQ("Let's start broadly. Tell me a little bit about yourself, your background, and any recent projects you've been working on.");
        setAnswer("");
        setSeconds(0);
        setTimerActive(true);
    };

    const submitAnswer = async () => {
        if (!answer.trim()) return;
        setLoading(true);
        setTimerActive(false);
        if (isRecording) toggleRecording();

        try {
            // 1. Evaluate the answer silently. 
            // Note: We pass { lenientSTT: true } so the backend knows to ignore minor grammar/speech-to-text hiccups.
            const feedbackResult = await evaluateInterviewAnswer(currentQ, answer, role, { lenientSTT: true });
            
            // 2. Save to history
            const newHistory = [...history, {
                question: currentQ,
                answer: answer,
                feedback: feedbackResult,
                score: feedbackResult.score || 0
            }];
            setHistory(newHistory);

            // 3. Determine Next Steps (Continue or Finish)
            if (currentQIndex >= TOTAL_QUESTIONS) {
                setPhase("completed");
            } else {
                // 4. Generate the next question based on context
                const nextQ = await generateNextAdaptiveQuestion(answer, role, currentQIndex + 1);
                setCurrentQ(nextQ);
                setCurrentQIndex(prev => prev + 1);
                setAnswer("");
                setSeconds(0);
                setTimerActive(true);
            }
        } catch (error) {
            console.error("Evaluation Failed:", error);
            alert("Failed to process answer. Make sure the backend is running.");
            setTimerActive(true); // resume timer if failed so they can try again
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
    
    const calculateAverageScore = () => {
        if (history.length === 0) return 0;
        const total = history.reduce((acc, curr) => acc + curr.score, 0);
        return Math.round(total / history.length);
    };

    if (!user) return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
            <div className="flex gap-1">
                <div className="w-3 h-3 rounded-full bg-[#6C63FF] pulse-dot" />
                <div className="w-3 h-3 rounded-full bg-[#6C63FF] pulse-dot" style={{ animationDelay: "0.2s" }} />
                <div className="w-3 h-3 rounded-full bg-[#6C63FF] pulse-dot" style={{ animationDelay: "0.4s" }} />
            </div>
        </div>
    );

    return (
        <DashboardShell user={user} title="Interview Prep" currentPage="InterviewPrep">
            <div className="grid lg:grid-cols-3 gap-6">
                
                {/* LEFT SIDEBAR - Context & Progress */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-gray-100 p-6 h-fit"
                >
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Mic className="w-5 h-5 text-[#6C63FF]" /> AI Interviewer
                    </h3>
                    
                    {phase === "setup" && (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-600 mb-4">Select your target role. The interview will adapt to your answers over {TOTAL_QUESTIONS} questions.</p>
                            <div className="relative">
                                <label className="text-sm font-medium text-gray-700 mb-2 block">Target Role</label>
                                <Select value={role} onValueChange={setRole}>
                                    <SelectTrigger className="rounded-xl bg-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white z-[100] border border-gray-200 shadow-xl rounded-xl">
                                        <SelectItem value="frontend" className="cursor-pointer hover:bg-gray-50">Frontend Developer</SelectItem>
                                        <SelectItem value="backend" className="cursor-pointer hover:bg-gray-50">Backend Developer</SelectItem>
                                        <SelectItem value="fullstack" className="cursor-pointer hover:bg-gray-50">Full Stack Developer</SelectItem>
                                        <SelectItem value="data_science" className="cursor-pointer hover:bg-gray-50">Data Scientist</SelectItem>
                                        <SelectItem value="product" className="cursor-pointer hover:bg-gray-50">Product Manager</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    {phase === "active" && (
                        <div className="space-y-6">
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-2">Current Progress</p>
                                <div className="flex items-center justify-between text-sm mb-1">
                                    <span className="font-bold text-[#6C63FF]">Question {currentQIndex}</span>
                                    <span className="text-gray-400">of {TOTAL_QUESTIONS}</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2.5">
                                    <div 
                                        className="bg-[#6C63FF] h-2.5 rounded-full transition-all duration-500" 
                                        style={{ width: `${(currentQIndex / TOTAL_QUESTIONS) * 100}%` }}
                                    ></div>
                                </div>
                            </div>

                            {timerActive && (
                                <div className="text-center pt-4 border-t border-gray-100">
                                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Answer Time</p>
                                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50">
                                        <Timer className="w-4 h-4 text-red-500" />
                                        <span className="text-xl font-bold text-red-600 tracking-widest">{formatTime(seconds)}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {phase === "completed" && (
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-500 mb-4">Overall Performance</p>
                            <div className="relative w-32 h-32 mx-auto">
                                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                                    <path
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        fill="none"
                                        stroke="#F3F4F6"
                                        strokeWidth="3"
                                    />
                                    <path
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        fill="none"
                                        stroke={calculateAverageScore() >= 70 ? "#10B981" : calculateAverageScore() >= 50 ? "#F59E0B" : "#EF4444"}
                                        strokeWidth="3"
                                        strokeDasharray={`${calculateAverageScore()}, 100`}
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <span className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-gray-800">
                                    {calculateAverageScore()}%
                                </span>
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* RIGHT MAIN AREA - Interaction & Results */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-2 space-y-6"
                >
                    {phase === "setup" && (
                        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center h-full flex flex-col items-center justify-center min-h-[400px]">
                            <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-6">
                                <PlayCircle className="w-8 h-8 text-[#6C63FF]" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-3">Ready to begin?</h2>
                            <p className="text-gray-500 max-w-md mx-auto mb-8">
                                You will be asked {TOTAL_QUESTIONS} questions. Speak naturally, as the AI will evaluate your answers leniently, taking speech-to-text imperfections into account. Your results will be calculated at the end.
                            </p>
                            <Button
                                onClick={startInterview}
                                className="bg-[#6C63FF] text-white rounded-xl hover:bg-[#5A52D5] px-8 py-6 text-lg"
                            >
                                Start Interview
                            </Button>
                        </div>
                    )}

                    {phase === "active" && (
                        <div className="bg-white rounded-2xl border border-gray-100 p-6">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0 mt-1">
                                    <Brain className="w-5 h-5 text-[#6C63FF]" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 mb-2">Question {currentQIndex}</h3>
                                    <p className="text-gray-800 text-lg leading-relaxed">
                                        {currentQ}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="mt-6 border-t border-gray-100 pt-6">
                                <Textarea
                                    placeholder="Click the microphone to start speaking, or type your answer here..."
                                    value={answer}
                                    onChange={(e) => setAnswer(e.target.value)}
                                    rows={8}
                                    className="rounded-xl border-gray-200 focus:border-[#6C63FF] focus:ring-[#6C63FF] text-base"
                                />
                                
                                <div className="flex flex-col sm:flex-row gap-3 mt-4">
                                    <Button
                                        type="button"
                                        onClick={toggleRecording}
                                        className={`flex-1 rounded-xl shadow-sm border transition-colors py-6 ${
                                            isRecording 
                                                ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100 animate-pulse' 
                                                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                                        }`}
                                    >
                                        {isRecording ? (
                                            <><MicOff className="w-5 h-5 mr-2" /> Stop Recording</>
                                        ) : (
                                            <><Mic className="w-5 h-5 mr-2" /> Voice Assist</>
                                        )}
                                    </Button>
                                    <Button
                                        onClick={submitAnswer}
                                        disabled={!answer.trim() || loading}
                                        className="flex-1 bg-[#6C63FF] text-white rounded-xl hover:bg-[#5A52D5] shadow-sm py-6"
                                    >
                                        {loading ? (
                                            <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                                        ) : (
                                            <Send className="w-5 h-5 mr-2" />
                                        )}
                                        {currentQIndex === TOTAL_QUESTIONS ? "Finish Interview" : "Submit & Next"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {phase === "completed" && (
                        <div className="space-y-6">
                            <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                        <ClipboardList className="w-6 h-6 text-[#6C63FF]" /> Interview Complete
                                    </h2>
                                    <p className="text-gray-500 text-sm mt-1">Review your detailed feedback below.</p>
                                </div>
                                <Button onClick={() => setPhase("setup")} variant="outline" className="rounded-xl">
                                    Start New Session
                                </Button>
                            </div>

                            {/* Render all stored feedback */}
                            {history.map((item, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="bg-white rounded-2xl border border-gray-100 p-6 overflow-hidden"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="font-bold text-gray-900">Q{index + 1}: {item.question}</h3>
                                        <div className="px-3 py-1 bg-purple-50 text-[#6C63FF] font-bold rounded-full text-sm">
                                            Score: {item.score}
                                        </div>
                                    </div>
                                    
                                    <div className="bg-gray-50 p-4 rounded-xl mb-6 border border-gray-100">
                                        <span className="text-xs font-bold text-gray-400 uppercase mb-1 block">Your Answer:</span>
                                        <p className="text-sm text-gray-700 italic">"{item.answer}"</p>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                                        <div className="bg-green-50 rounded-xl p-4">
                                            <h4 className="text-sm font-bold text-green-700 mb-2 flex items-center gap-1">
                                                <CheckCircle className="w-4 h-4" /> Good Points
                                            </h4>
                                            <ul className="space-y-1">
                                                {item.feedback?.good_points?.map((p, i) => (
                                                    <li key={i} className="text-sm text-green-700">• {p}</li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="bg-amber-50 rounded-xl p-4">
                                            <h4 className="text-sm font-bold text-amber-700 mb-2 flex items-center gap-1">
                                                <Star className="w-4 h-4" /> Improvements
                                            </h4>
                                            <ul className="space-y-1">
                                                {item.feedback?.improvements?.map((p, i) => (
                                                    <li key={i} className="text-sm text-amber-700">• {p}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                    
                                    {item.feedback?.model_answer && (
                                        <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                                            <h4 className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-1">
                                                <Award className="w-4 h-4" /> Ideal Structure
                                            </h4>
                                            <p className="text-sm text-blue-900/80 leading-relaxed">{item.feedback.model_answer}</p>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>
        </DashboardShell>
    );
}