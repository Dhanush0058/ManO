import React, { useEffect, useRef, useState } from 'react';
import { Send, Bot, Loader2 } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  agent?: string;
  text: string;
}

interface CommandCenterProps {
  messages: ChatMessage[];
  onSendMessage: (msg: string) => void;
  isLoading: boolean;
}

export function CommandCenter({ messages, onSendMessage, isLoading }: CommandCenterProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // A small timeout ensures the DOM has fully painted the new message
    // and updated the scrollHeight before we scroll.
    const timer = setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="glass-panel rounded-xl flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-gray-800 bg-gray-900/50 flex items-center gap-2">
        <Bot className="text-blue-400 w-5 h-5" />
        <h2 className="font-semibold text-gray-200">ManO Command Center</h2>
      </div>

      <div ref={scrollRef} className="flex-1 min-h-0 p-4 overflow-y-auto space-y-4">
        {messages.map((m) =>
          m.role === 'assistant' ? (
            <div key={m.id} className="max-w-[80%]">
              {m.agent && (
                <div className="text-xs font-medium text-blue-400 mb-1 ml-1">{m.agent}</div>
              )}
              <div className="bg-blue-900/20 text-blue-100 p-3 rounded-lg rounded-tl-none border border-blue-800/30">
                {m.text}
              </div>
            </div>
          ) : (
            <div key={m.id} className="max-w-[80%] ml-auto">
              <div className="bg-gray-700/60 text-gray-100 p-3 rounded-lg rounded-tr-none border border-gray-600/40">
                {m.text}
              </div>
            </div>
          )
        )}

        {isLoading && (
          <div className="max-w-[80%] flex items-center gap-2 text-sm text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            Thinking...
          </div>
        )}
      </div>

      <div className="p-4 bg-gray-900/50 border-t border-gray-800">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. What's our runway if we hire a CTO?"
            className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg py-3 px-4 pr-12 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-2 p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-500 hover:shadow-md active:scale-90 disabled:opacity-50 disabled:active:scale-100 transition-all duration-150"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}
