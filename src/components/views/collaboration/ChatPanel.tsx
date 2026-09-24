import React from 'react';
import { Send } from 'lucide-react';
import { ChatMessage } from './interfaces';

interface ChatPanelProps {
  messages: ChatMessage[];
  inputText: string;
  setInputText: (v: string) => void;
  handleSendMessage: (e?: React.FormEvent) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export default function ChatPanel({
  messages,
  inputText,
  setInputText,
  handleSendMessage,
  messagesEndRef
}: ChatPanelProps) {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-950/20">
      {/* Chat messages stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {messages.map((msg) => {
          const initials = msg.name ? msg.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : '?';
          return (
            <div key={msg.id} className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center text-[10px] font-bold text-indigo-300 shrink-0">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-1">
                  <span className="text-[11px] font-bold text-slate-200">{msg.name}</span>
                  <span className="text-[9px] text-slate-500 font-medium">{msg.timestamp}</span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed break-words font-medium">
                  {msg.text}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat message form */}
      <form onSubmit={handleSendMessage} className="p-3 shrink-0 bg-slate-900 border-t border-slate-850">
        <div className="relative flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Message partners...`}
            className="w-full pl-4 pr-20 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-xs focus:outline-hidden focus:border-indigo-500/45 focus:ring-1 focus:ring-indigo-500/20 text-slate-200 transition-all placeholder:text-slate-650 font-medium"
          />
          <button
            type="submit"
            className="absolute right-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-black transition-all duration-200 active:scale-95 cursor-pointer flex items-center gap-1"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
