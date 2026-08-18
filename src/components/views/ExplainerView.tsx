import { useState, useEffect, FormEvent } from 'react';
import { Sparkles, Send, Bot, User, RefreshCw, Maximize2, Minimize2 } from 'lucide-react';
import { Language, Subject } from '../../types';

interface ExplainerViewProps {
  language: Language;
  initialQuery?: string;
  initialSubject?: Subject;
  onClearInitial?: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export default function ExplainerView({
  language,
  initialQuery,
  initialSubject,
  onClearInitial,
}: ExplainerViewProps) {

  const [prompt, setPrompt] = useState(initialQuery || '');
  const [selectedSubj, setSelectedSubj] = useState<Subject | 'General'>(initialSubject || 'General');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Hello! I am the AceMatric AI Concept Explainer. Ask me any Grade 12 concept, physics formula, or chemistry calculation, and I will explain it step-by-step with matric exam shortcuts!',
      timestamp: 'Just now',
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (initialQuery && messages.length === 1) {
      handleSendQuery(initialQuery, initialSubject || 'General');
      if (onClearInitial) onClearInitial();
    }
  }, [initialQuery]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    const textToSend = prompt;
    setPrompt('');
    await handleSendQuery(textToSend, selectedSubj);
  };

  const handleSendQuery = async (queryText: string, subj: string) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/concept-explainer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: queryText,
          subject: subj,
          language,
        }),
      });
      const data = await res.json();
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: data.explanation || 'Sorry, could not generate explanation at this moment.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'ai',
          text: `⚠️ Error: ${err.message || 'Network error while connecting to AI tutor.'}`,
          timestamp: 'Just now',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedPrompts = [
    'Explain Lenz’s Law with intuition',
    'How to solve pH buffer calculations quickly',
    'Summary of Krebs Cycle in ATP production',
  ];

  return (
    <div className="flex flex-col gap-6 animate-fadeIn text-slate-100">
      {/* AI Concept Explainer Interactive Chat Arena */}
      <div 
        onClick={() => {
          if (!isFocused) setIsFocused(true);
        }}
        className={`flex flex-col bg-[#1E293B] border transition-all duration-500 ease-out overflow-hidden ${
          isFocused 
            ? 'fixed inset-0 z-50 h-screen w-screen rounded-none border-none cursor-default bg-[#0F172A]' 
            : 'h-[550px] border-slate-800 hover:border-slate-700/80 cursor-pointer rounded-3xl shadow-2xl'
        }`}
      >
        {/* Chat Header Bar */}
        <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
              <Bot className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-base text-white">
                  AI Concept Explainer
                </h2>
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] uppercase font-extrabold">Gemini Pro</span>
                {isFocused && (
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 text-[10px] font-bold border border-teal-500/20 animate-pulse">
                    ✨ Full-Screen Focus Mode
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Custom AI tutor trained on Ethiopian Grade 12 national curriculum.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <select
              value={selectedSubj}
              onChange={(e) => setSelectedSubj(e.target.value as any)}
              className="bg-slate-800 border border-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg text-teal-300 focus:outline-none"
              onClick={(e) => e.stopPropagation()}
            >
              <option value="General">🌐 General</option>
              <option value="Physics">🧬 Physics</option>
              <option value="Chemistry">⚗️ Chemistry</option>
              <option value="Biology">🌿 Biology</option>
              <option value="Mathematics">📐 Mathematics</option>
              <option value="English">🇬🇧 English / SAT</option>
              <option value="Economics">📊 Economics</option>
            </select>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsFocused(!isFocused);
              }}
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 hover:text-white transition-all cursor-pointer flex items-center justify-center shadow-sm"
              title={isFocused ? "Minimize to Standard" : "Expand to Full Page"}
            >
              {isFocused ? (
                <div className="flex items-center space-x-1.5">
                  <Minimize2 className="w-4 h-4 text-rose-400" />
                  <span className="text-[10px] font-black uppercase text-rose-400 hidden sm:inline">Minimize</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1.5">
                  <Maximize2 className="w-4 h-4 text-teal-400" />
                  <span className="text-[10px] font-black uppercase text-teal-400 hidden sm:inline">Expand</span>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Message Thread Scroll Area */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-[#0F172A]/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-xs ${
                  msg.sender === 'user'
                    ? 'bg-teal-500 text-slate-950 shadow-md'
                    : 'bg-indigo-600 shadow-md'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-5 h-5 text-slate-950" /> : <Sparkles className="w-5 h-5" />}
              </div>

              <div
                className={`max-w-[80%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-teal-500 text-slate-950 font-bold rounded-tr-none'
                    : 'bg-slate-800/90 border border-slate-700/80 text-slate-100 rounded-tl-none whitespace-pre-line font-normal shadow-md'
                }`}
              >
                {msg.text}
                <div
                  className={`text-[9px] mt-1.5 text-right font-medium ${
                    msg.sender === 'user' ? 'text-slate-800' : 'text-slate-500'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-3 text-slate-400 text-xs bg-slate-800/60 p-4 rounded-2xl max-w-xs animate-pulse border border-slate-700">
              <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
              <span>AI tutor is crafting step-by-step breakdown...</span>
            </div>
          )}
        </div>

        {/* Suggested Prompt Chips */}
        <div className="px-6 py-2 bg-slate-900/80 border-t border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar max-w-full">
          <span className="text-[10px] font-extrabold uppercase text-slate-500 shrink-0">💡 Try Asking:</span>
          {suggestedPrompts.map((sp, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                handleSendQuery(sp, selectedSubj);
                setIsFocused(true);
              }}
              disabled={isLoading}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-[11px] text-slate-300 font-bold whitespace-nowrap transition-colors shrink-0 cursor-pointer"
            >
              {sp}
            </button>
          ))}
        </div>

        {/* Input Composer Footer */}
        <form 
          onSubmit={handleSend} 
          onClick={(e) => e.stopPropagation()} 
          className="p-4 bg-slate-900 border-t border-slate-800 flex items-center gap-3"
        >
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onFocus={() => setIsFocused(true)}
            placeholder="Ask concept explainer anything about Grade 12 matric..."
            disabled={isLoading}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={!prompt.trim() || isLoading}
            className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-transform active:scale-95 disabled:opacity-40 flex items-center space-x-1.5 shrink-0 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
