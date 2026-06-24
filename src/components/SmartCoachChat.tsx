/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, FormEvent } from "react";
import { Send, Bot, User, Volume2, VolumeX, Sparkles, AlertCircle, Loader2, Key } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ChatMessage, Task } from "../types";

interface SmartCoachChatProps {
  currentTask: Task | null;
  geminiApiKey?: string;
  onOpenSidebar?: () => void;
}

export default function SmartCoachChat({ 
  currentTask,
  geminiApiKey = "",
  onOpenSidebar = () => {},
}: SmartCoachChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init-1",
      sender: "coach",
      text: "I am your Rescue Companion. Got a deadline slipping or feeling stuck? Tell me what's overwhelming you right now, and let's break it down!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputVal, setInputVal] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [ttsEngine, setTtsEngine] = useState<"client" | "gemini" | "off">("client");
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  const endRef = useRef<HTMLDivElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle voice synthesis on new coach message
  const lastMessage = messages[messages.length - 1];
  useEffect(() => {
    if (lastMessage && lastMessage.sender === "coach" && messages.length > 1) {
      speakText(lastMessage.text, lastMessage.id);
    }
  }, [messages.length]);

  const speakText = async (textString: string, messageId: string) => {
    if (ttsEngine === "off") return;
    setSpeakingMsgId(messageId);
    setAudioError(null);

    // 1. Client-Side Web Speech API (Instant, local browser voice)
    if (ttsEngine === "client") {
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(textString);
        utter.rate = 1.05;
        utter.pitch = 1.0;
        utter.onend = () => setSpeakingMsgId(null);
        utter.onerror = () => setSpeakingMsgId(null);
        window.speechSynthesis.speak(utter);
      } catch (e) {
        console.warn("SpeechSynthesis error:", e);
        setSpeakingMsgId(null);
      }
      return;
    }

    // 2. Server-side Gemini Neural TTS (Gemini Speech Synthesis)
    if (ttsEngine === "gemini") {
      try {
        const response = await fetch("/api/speak-coach", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "X-Gemini-API-Key": geminiApiKey
          },
          body: JSON.stringify({ text: textString, voice: "Zephyr" }),
        });

        if (!response.ok) {
          throw new Error("Gemini server-TTS request failed");
        }

        const data = await response.json();
        if (data.audio) {
          playPCMBase64(data.audio);
        } else {
          throw new Error("No audio payload returned");
        }
      } catch (err: any) {
        console.error("Gemini TTS play error:", err);
        setAudioError("Gemini server voice failed. Falling back to local Web voice.");
        setTtsEngine("client");
        // immediately fall back to client speech
        try {
          const utter = new SpeechSynthesisUtterance(textString);
          utter.onend = () => setSpeakingMsgId(null);
          window.speechSynthesis.speak(utter);
        } catch (_) {}
      }
    }
  };

  // Decode and play raw 16-bit PCM stream mapped to 24kHz
  const playPCMBase64 = (base64Data: string) => {
    try {
      if (!audioContextRef.current) {
        const AudioClass = window.AudioContext || (window as any).webkitAudioContext;
        // Gemini TTS outputs at 24000 Hz, so target that exact sample rate
        audioContextRef.current = new AudioClass({ sampleRate: 24000 });
      }
      
      const ctx = audioContextRef.current;
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert bytes into standard 16-bit integers
      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0; // normalize
      }

      const buffer = ctx.createBuffer(1, float32Array.length, 24000);
      buffer.getChannelData(0).set(float32Array);

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.onended = () => setSpeakingMsgId(null);
      source.start();
    } catch (err) {
      console.error("PCM Audio Decode failed", err);
      setSpeakingMsgId(null);
    }
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!isOnline) {
      setMessages((prev) => [
        ...prev,
        {
          id: "offline-error-" + Date.now(),
          sender: "coach",
          text: "⚠️ I can't process your request right now because you are offline. Please restore your internet connection to access real-time AI productivity coaching.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
      return;
    }
    if (!inputVal.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: "msg-" + Date.now(),
      sender: "user",
      text: inputVal,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputVal("");
    setIsLoading(true);
    setAudioError(null);

    try {
      const response = await fetch("/api/chat-coach", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Gemini-API-Key": geminiApiKey
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          userTaskContext: currentTask,
        }),
      });

      if (!response.ok) throw new Error("Chat api request issue");
      const data = await response.json();

      const coachMessage: ChatMessage = {
        id: "coach-" + Date.now(),
        sender: "coach",
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, coachMessage]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: "coach-error-" + Date.now(),
          sender: "coach",
          text: "I'm experiencing high latency right now. Let's do a 5-minute Pomodoro sprint together on your task! What small thing can we outline first?",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const stopActiveSpeech = () => {
    window.speechSynthesis.cancel();
    setSpeakingMsgId(null);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-xl flex flex-col h-[460px] relative overflow-hidden transition-colors duration-300">
      
      {/* Wave animation header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3 bg-white dark:bg-slate-900">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Rescue Partner Coach</h4>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Conversational ADHD/Inertia Guide</p>
          </div>
        </div>

        {/* TTS Toggle Selectors */}
        <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-0.5 rounded-full">
          <button
            onClick={() => { setTtsEngine("client"); stopActiveSpeech(); }}
            title="Local Voice synthesis"
            className={`px-2 py-1 text-[9px] font-bold rounded-full transition-colors cursor-pointer ${
              ttsEngine === "client" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Local TTS
          </button>
          <button
            onClick={() => { setTtsEngine("gemini"); stopActiveSpeech(); }}
            title="Full Premium Gemini-TTS voice"
            className={`px-2 py-1 text-[9px] font-bold rounded-full transition-colors cursor-pointer ${
              ttsEngine === "gemini" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            AI Voice
          </button>
          <button
            onClick={() => { setTtsEngine("off"); stopActiveSpeech(); }}
            title="Mute Coach Speech"
            className={`p-1.5 rounded-full transition-colors cursor-pointer ${
              ttsEngine === "off" ? "bg-slate-205 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shadow-sm" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350"
            }`}
          >
            <VolumeX className="w-3 h-3" />
          </button>
        </div>
      </div>

      {audioError && (
        <div className="flex items-center gap-1 p-2 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 text-[10px] rounded-xl mb-2 border border-amber-100 dark:border-amber-900/30">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{audioError}</span>
        </div>
      )}

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 py-1 scrollbar-thin">
        {messages.map((m) => {
          const isCoach = m.sender === "coach";
          const isSpeaking = speakingMsgId === m.id;
          return (
            <div
              key={m.id}
              className={`flex items-start gap-2.5 max-w-[85%] ${
                isCoach ? "self-start" : "ml-auto flex-row-reverse"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center border text-xs font-semibold ${
                  isCoach
                    ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400"
                    : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-400"
                }`}
              >
                {isCoach ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              <div className="flex flex-col">
                <div
                  onClick={() => isCoach && speakText(m.text, m.id)}
                  className={`relative p-3 rounded-2xl text-xs font-medium leading-relaxed shadow-sm transition-all group ${
                    isCoach
                      ? "bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 text-slate-800 dark:text-slate-200 rounded-tl-none cursor-pointer hover:bg-slate-100/70 dark:hover:bg-slate-900/50"
                      : "bg-indigo-600 text-white rounded-tr-none"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  
                  {isCoach && (
                    <button
                      className={`absolute right-1.5 bottom-1.5 p-1 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 group-hover:block ${
                        isSpeaking ? "block text-indigo-600 dark:text-indigo-450 animate-pulse bg-indigo-50 dark:bg-indigo-950/30" : "hidden"
                      }`}
                    >
                      <Volume2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <span
                  className={`text-[9px] text-slate-400 dark:text-slate-500 font-semibold mt-1 ${
                    isCoach ? "self-start" : "self-end"
                  }`}
                >
                  {m.timestamp}
                </span>
              </div>
            </div>
          );
        })}
        {isLoading && (
          <div className="flex items-center gap-2.5 self-start max-w-[80%]">
            <div className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 animate-spin">
              <Loader2 className="w-4 h-4" />
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 p-3 rounded-2xl rounded-tl-none text-xs text-slate-400 dark:text-slate-500 font-medium">
              Formulating psychological workaround...
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input container */}
      {!geminiApiKey ? (
        <div className="mt-2.5 bg-slate-50 dark:bg-slate-950 border border-amber-200/50 dark:border-amber-900/30 p-3 rounded-2xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold leading-tight">
              API Key Setup Required to talk with AI Coach
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenSidebar}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] rounded-xl cursor-pointer border-none"
            id="chat-setup-key-btn"
          >
            Setup Key
          </button>
        </div>
      ) : (
        <form onSubmit={handleSendMessage} className="mt-2.5 flex flex-col gap-1.5">
          {!isOnline && (
            <div className="text-[10px] bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-400 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full shrink-0" />
              <span>AI Coach is offline. Please reconnect to use AI features.</span>
            </div>
          )}
          <div className="flex items-center gap-2 w-full">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              disabled={!isOnline}
              placeholder={
                !isOnline 
                  ? "AI Coach is currently offline..."
                  : currentTask
                    ? `Ask how to approach: "${currentTask.title.slice(0, 18)}..."`
                    : "Tell the coach what's making you avoid starting..."
              }
              className={`flex-1 text-slate-700 dark:text-slate-200 p-3 rounded-2xl text-xs border border-slate-200 dark:border-slate-800 transition-all font-medium focus:outline-none ${
                !isOnline 
                  ? "bg-slate-100 dark:bg-slate-950 text-slate-400 dark:text-slate-600 cursor-not-allowed border-slate-150 dark:border-slate-900" 
                  : "bg-slate-50 dark:bg-slate-950 hover:bg-slate-100/50 dark:hover:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950/50"
              }`}
            />
            <button
              type="submit"
              disabled={!isOnline}
              className={`p-3 rounded-2xl flex items-center justify-center transition-all shrink-0 border-none ${
                !isOnline
                  ? "bg-slate-200 dark:bg-slate-850 text-slate-450 dark:text-slate-550 cursor-not-allowed shadow-none"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md dark:shadow-none shadow-indigo-100 cursor-pointer"
              }`}
            >
              <Send className="w-4.5 h-4.5" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
