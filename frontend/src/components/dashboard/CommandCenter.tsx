import React, { useState } from 'react';
import { Send, Bot, Loader2 } from 'lucide-react';

interface CommandCenterProps {
  onSendMessage: (msg: string) => void;
  isLoading: boolean;
}

export function CommandCenter({ onSendMessage, isLoading }: CommandCenterProps) {
  const [input, setInput] = useState('');

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

      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        <div className="bg-blue-900/20 text-blue-100 p-3 rounded-lg rounded-tl-none max-w-[80%] border border-blue-800/30">
          Hello Founder. I'm ready to coordinate your agents. What do you need?
        </div>
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
            className="absolute right-2 top-2 p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-500 disabled:opacity-50 transition-colors"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}
