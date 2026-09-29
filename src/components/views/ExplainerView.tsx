import { useState, useEffect, useRef, FormEvent } from 'react';
import { Sparkles, Send, User, RefreshCw, Maximize2, Minimize2, Copy, Check, Trash2, BookOpen } from 'lucide-react';
import { Language, Subject } from '../../types';
import { getAccessToken } from '../../lib/authToken';
import { sanitizeHtml } from '../../lib/sanitize';

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

const SUBJECT_PROMPTS: Record<string, string[]> = {
  Physics: [
    'Explain Projectile Motion and how to find max height and range',
    'How do I use Lenz’s Law and Fleming’s Right-Hand Rule in exams?',
    'What is the difference between elastic and inelastic collision formulas?'
  ],
  Mathematics: [
    'How to find limits using L’Hôpital’s Rule step by step',
    'What is the easiest way to find the inverse of a 2x2 matrix?',
    'Sum to infinity of geometric sequence formula and examples'
  ],
  Chemistry: [
    'How to calculate pH for buffer solutions in entrance exams',
    'Explain Le Chatelier’s principle with equilibrium shifts',
    'Standard reduction potential and galvanic cell calculations'
  ],
  Biology: [
    'Detailed step-by-step of Cellular Respiration: Glycolysis to ATP',
    'Mendelian genetics: dihybrid cross and Punnett square probability',
    'Human nervous system: action potential and synaptic transmission'
  ],
  General: [
    'Explain how to calculate speed and velocity in two dimensions',
    'Key formulas for Ethiopian Grade 12 National Exam in Physics & Maths',
    'How to eliminate wrong options quickly on multiple choice questions'
  ]
};

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
      text: `<h3>Welcome to AceMatric AI Tutor!</h3>
<p>I am your dedicated <strong>Ethiopian National Matric Exam tutor</strong>. Ask me any Grade 11-12 concept, formula derivation, or difficult past exam problem in <strong>Physics, Mathematics, Chemistry, Biology, English, or SAT</strong>.</p>
<p>I will give you clear conceptual explanations, governing formulas, step-by-step worked examples, and matric exam shortcuts!</p>`,
      timestamp: 'Just now',
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

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

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const token = getAccessToken();
      const history = newMessages
        .filter(m => m.id !== 'welcome')
        .slice(-6)
        .map(m => ({ role: m.sender === 'user' ? 'user' : 'model', text: m.text }));

      const res = await fetch('/api/ai/concept-explainer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          prompt: queryText,
          subject: subj,
          language,
          history,
        }),
      });

      const data = await res.json();
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: data.explanation || '<p>Sorry, could not generate an explanation at this moment. Please try asking with more details.</p>',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'ai',
          text: `<p><strong>Connection Notice:</strong> Unable to connect to AI server. Please check your network connection and try again.</p>`,
          timestamp: 'Just now',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    const cleanText = text.replace(/<[^>]*>?/gm, '');
    navigator.clipboard.writeText(cleanText).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'ai',
        text: `<h3>Welcome to AceMatric AI Tutor!</h3><p>Chat cleared. Ask me any Matric concept or past problem to begin!</p>`,
        timestamp: 'Just now',
      }
    ]);
  };

  const currentPrompts = SUBJECT_PROMPTS[selectedSubj] || SUBJECT_PROMPTS.General;

  return (
    <div className="flex flex-col gap-6 text-slate-100">
      <div 
        className={`flex flex-col bg-[#0E131F] border transition-all duration-300 ease-out overflow-hidden shadow-2xl ${
          isFocused 
            ? 'fixed inset-0 z-50 h-screen w-screen rounded-none border-none bg-[#090D15]' 
            : 'h-[620px] border-slate-800/80 rounded-2xl'
        }`}
      >
        {/* Top Header */}
        <div className="px-6 py-4 bg-[#121826] border-b border-slate-800/80 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-white">AceMatric AI Tutor</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  National Exam Grounded
                </span>
              </div>
              <p className="text-xs text-slate-400">Step-by-step solutions, formulas, and Ethiopian Matric shortcuts</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedSubj}
              onChange={(e) => setSelectedSubj(e.target.value as Subject | 'General')}
              className="bg-slate-800/80 border border-slate-700/80 text-white rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="General">All Subjects</option>
              <option value="Physics">Physics</option>
              <option value="Maths">Mathematics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Biology">Biology</option>
              <option value="English">English / SAT</option>
              <option value="Economics">Economics</option>
              <option value="History">History</option>
              <option value="Geography">Geography</option>
            </select>

            <button
              onClick={handleClearChat}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 rounded-xl transition-colors cursor-pointer"
              title="Clear Chat History"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsFocused(!isFocused)}
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 hover:text-white transition-all cursor-pointer flex items-center justify-center"
              title={isFocused ? "Minimize" : "Expand to Full Page"}
            >
              {isFocused ? (
                <Minimize2 className="w-4 h-4 text-rose-400" />
              ) : (
                <Maximize2 className="w-4 h-4 text-blue-400" />
              )}
            </button>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-[#090D15]/80">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-xs ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gradient-to-br from-emerald-600 to-teal-700 shadow-md'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[85%] rounded-2xl p-4 sm:p-5 text-xs sm:text-sm leading-relaxed shadow-md ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white font-semibold rounded-tr-none'
                    : 'bg-[#121826] border border-slate-800 text-slate-200 rounded-tl-none prose prose-invert prose-sm max-w-none'
                }`}
              >
                {msg.sender === 'user' ? (
                  <p className="whitespace-pre-line">{msg.text}</p>
                ) : (
                  <div
                    className="ai-tutor-response space-y-3"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(msg.text) }}
                  />
                )}

                <div className="mt-3 flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-slate-500">
                  <span>{msg.timestamp}</span>
                  {msg.sender === 'ai' && (
                    <button
                      onClick={() => handleCopy(msg.id, msg.text)}
                      className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors cursor-pointer text-xs"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-3 text-slate-400 text-xs bg-slate-900/80 p-4 rounded-2xl max-w-sm border border-slate-800 shadow-md animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
              <span>Analyzing curriculum & formulating step-by-step solution...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompt Chips */}
        <div className="px-6 py-2.5 bg-[#121826] border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar max-w-full">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 shrink-0 flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            Quick Prompts:
          </span>
          {currentPrompts.map((sp, idx) => (
            <button
              key={idx}
              onClick={() => handleSendQuery(sp, selectedSubj)}
              disabled={isLoading}
              className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-lg text-xs text-slate-300 font-semibold whitespace-nowrap transition-colors shrink-0 cursor-pointer"
            >
              {sp}
            </button>
          ))}
        </div>

        {/* Input Composer Footer */}
        <form 
          onSubmit={handleSend} 
          className="p-4 bg-[#0E131F] border-t border-slate-800/80 flex items-center gap-3"
        >
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={`Ask AI Tutor anything about Grade 11-12 ${selectedSubj === 'General' ? 'Matric concepts' : selectedSubj}...`}
            disabled={isLoading}
            className="flex-1 bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
          />
          <button
            type="submit"
            disabled={!prompt.trim() || isLoading}
            className="px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-md transition-transform active:scale-95 disabled:opacity-40 flex items-center space-x-1.5 shrink-0 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Ask Tutor</span>
          </button>
        </form>
      </div>
    </div>
  );
}
