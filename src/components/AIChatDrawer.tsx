import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, MessageSquareCode, ArrowDownCircle, Sliders, CheckCircle2 } from 'lucide-react';
import { ChatMessage } from '../types';

interface AIChatDrawerProps {
  chatHistory: ChatMessage[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  isOpen: boolean;
  onToggleOpen: () => void;
}

const CHAT_PROMPTS = [
  { label: 'Log Kind of Blue', text: 'I picked up Kind of Blue by Miles Davis, decent shape but the sleeve is beat up. Cost me 25 bucks.' },
  { label: 'Check Budget & Recommend', text: 'What should I dig for next with my remaining budget?' },
  { label: 'Log Rare $200 Record', text: 'Log a $200 rare Blue Note original album to my collection.' },
  { label: 'Log A Love Supreme to Wishlist', text: 'Add A Love Supreme to my wishlist, NM condition, estimated price is $38.' }
];

export default function AIChatDrawer({ chatHistory, onSendMessage, isLoading, isOpen, onToggleOpen }: AIChatDrawerProps) {
  const [inputText, setInputText] = useState('');
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText);
    setInputText('');
  };

  return (
    <div 
      className={`fixed top-0 bottom-0 right-0 w-full sm:w-[400px] bg-zinc-950 border-l border-zinc-800 shadow-2xl z-40 transition-transform duration-500 ease-in-out flex flex-col justify-between ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
    >
      {/* Header */}
      <div className="bg-zinc-900/80 p-4 border-b border-zinc-800 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/30">
            <Sparkles className="w-4.5 h-4.5 text-amber-500 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">CrateDigger AI</h3>
            <p className="text-[10px] text-zinc-400">Audiophile Agent Partner</p>
          </div>
        </div>
        <button 
          onClick={onToggleOpen}
          className="text-xs text-zinc-400 hover:text-white border border-zinc-800 bg-zinc-900 px-3 py-1 rounded-lg font-semibold cursor-pointer"
        >
          Hide &rarr;
        </button>
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        {chatHistory.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <MessageSquareCode className="w-12 h-12 stroke-1 text-zinc-700 mx-auto animate-pulse" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Active Agent Dialogue</h4>
              <p className="text-[10px] text-zinc-500 max-w-xs mx-auto leading-relaxed px-4">
                Chat with CrateDigger AI to log records in natural language, request price assessments, or recommend albums within your remaining monthly budget.
              </p>
            </div>
          </div>
        ) : (
          chatHistory.map((msg) => (
            <div 
              key={msg.id}
              className={`flex flex-col space-y-1.5 max-w-[85%] ${msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
            >
              {/* Message Bubble */}
              <div 
                className={`p-3 rounded-2xl text-[11px] leading-relaxed border ${
                  msg.role === 'user' 
                    ? 'bg-amber-500 text-zinc-950 border-amber-500/10 font-medium rounded-tr-none shadow-md shadow-amber-950/10' 
                    : 'bg-zinc-900 text-zinc-200 border-zinc-800 rounded-tl-none shadow-md shadow-black/20'
                }`}
              >
                {/* Simulated Markdown conversion / render */}
                <div className="whitespace-pre-wrap break-words space-y-2">
                  {msg.text.split('\n\n').map((para, i) => {
                    if (para.startsWith('###')) {
                      return <h4 key={i} className="font-bold text-xs uppercase tracking-wide text-amber-400 mt-1">{para.replace('###', '').trim()}</h4>;
                    }
                    if (para.startsWith('-')) {
                      return (
                        <ul key={i} className="list-disc list-inside space-y-1 text-zinc-300">
                          {para.split('\n').map((li, j) => (
                            <li key={j}>{li.replace('-', '').trim()}</li>
                          ))}
                        </ul>
                      );
                    }
                    return <p key={i}>{para}</p>;
                  })}
                </div>
              </div>

              {/* Action State Executed Notification Badge */}
              {msg.actionExecuted && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/15 border border-emerald-500/25 rounded-full text-[9px] text-emerald-300 font-mono animate-fade-in shadow-sm">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>State Executed: {msg.actionExecuted.details}</span>
                </div>
              )}

              {/* Timestamp label */}
              <span className="text-[8px] font-mono text-zinc-500 px-1">
                {msg.timestamp}
              </span>
            </div>
          ))
        )}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex items-center gap-1.5 mr-auto max-w-[80%] bg-zinc-900 border border-zinc-800 p-3 rounded-2xl rounded-tl-none text-[11px] text-zinc-400">
            <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            <span className="text-[10px] font-mono ml-1 text-zinc-500 uppercase tracking-widest">AGENT DIGGING...</span>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Prompts Helpers Drawer Expansion */}
      <div className="px-4 py-2 bg-zinc-900 border-t border-zinc-800/80 shrink-0">
        <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block mb-1.5">Suggested Prompts</span>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CHAT_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              onClick={() => {
                if (!isLoading) onSendMessage(prompt.text);
              }}
              disabled={isLoading}
              className="shrink-0 px-2.5 py-1 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-[9px] font-mono text-zinc-400 rounded-lg transition-all cursor-pointer disabled:opacity-50"
            >
              {prompt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <div className="p-4 bg-zinc-900 border-t border-zinc-800 shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
            placeholder="Type message to agent..."
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="w-10 h-10 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 text-zinc-950 disabled:text-zinc-600 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-lg shadow-amber-950/10"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

    </div>
  );
}
