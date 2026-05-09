'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Send, Paperclip, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { api } from '@/lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const IntelligencePanel = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();

  const suggestions = [
    "Today's revenue",
    "Active orders",
    "Stock status",
    "Staff performance",
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (text: string = query) => {
    if (!text.trim()) return;

    const userMessage: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    setQuery('');
    setIsTyping(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/ai/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('ordera_token')}`,
        },
        body: JSON.stringify({ query: text }),
      });

      if (!response.ok) throw new Error('Failed to fetch');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let aiContent = '';
      
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        // OpenRouter streaming sends SSE format: data: {"choices": [{"delta": {"content": "..."}}]}
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '');
            if (dataStr === '[DONE]') continue;
            try {
              const data = JSON.parse(dataStr);
              const token = data.choices[0]?.delta?.content || '';
              aiContent += token;
              setMessages((prev) => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1].content = aiContent;
                return newMessages;
              });
            } catch (e) {
              // Not JSON or incomplete chunk
            }
          }
        }
      }
    } catch (err) {
      console.error('AI Error:', err);
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div
      className={`fixed inset-y-0 right-0 w-[60%] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-gray-100 flex flex-col ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {/* HEADER */}
      <div className="h-20 border-b border-gray-100 px-8 flex items-center justify-between bg-gray-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 shadow-sm border border-amber-100">
            <Sparkles size={20} />
          </div>
          <h2 className="font-display text-xl text-[#1A1A2E]">Ordera Intelligence</h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
            <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center text-amber-500 mb-6 animate-pulse">
              <Sparkles size={40} />
            </div>
            <h3 className="font-display text-2xl text-[#1A1A2E] mb-3">Ask me anything</h3>
            <p className="text-gray-400 text-sm mb-8">
              I can help you analyze revenue, track stock levels, or give performance insights about your branch.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="px-4 py-2 rounded-full bg-[#F5ECD9] text-[#C97B2A] text-sm font-medium hover:bg-[#F2E4C4] transition-colors shadow-sm"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex gap-4 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-amber-500 flex-shrink-0 mt-1">
                    <Sparkles size={16} />
                  </div>
                )}
                <div
                  className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-[#1A1A2E] text-white rounded-tr-none'
                      : 'bg-[#F9FAFB] text-[#1A1A2E] border border-gray-100 rounded-tl-none'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-4 justify-start">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-amber-500 flex-shrink-0 mt-1">
                  <Sparkles size={16} />
                </div>
                <div className="bg-[#F9FAFB] border border-gray-100 p-4 rounded-2xl rounded-tl-none flex gap-1">
                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce"></span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* INPUT */}
      <div className="p-8 border-t border-gray-100 bg-white">
        <div className="relative flex items-center">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your question..."
            className="w-full h-14 pl-6 pr-16 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
          />
          <button
            onClick={() => handleSend()}
            disabled={!query.trim() || isTyping}
            className="absolute right-3 w-10 h-10 bg-[#C97B2A] text-white rounded-xl flex items-center justify-center hover:bg-[#B06B25] transition-colors disabled:opacity-50 shadow-md"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mt-3 text-center uppercase tracking-widest font-medium">
          Powered by Ordera Intelligence
        </p>
      </div>
    </div>
  );
};
