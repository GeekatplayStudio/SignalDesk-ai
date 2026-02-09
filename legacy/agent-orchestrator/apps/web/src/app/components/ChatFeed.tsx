import React from 'react';
import { motion } from 'motion/react';
import { User, Bot, AlertCircle, Headphones, Send } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: string;
  isHandoff?: boolean;
}

interface ChatFeedProps {
  messages: Message[];
  isTyping?: boolean;
  onSendMessage?: (msg: string) => void;
}

export const ChatFeed: React.FC<ChatFeedProps> = ({ messages, isTyping, onSendMessage }) => {
  const [input, setInput] = React.useState('');

  const handleSend = () => {
    if (input.trim() && onSendMessage) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 border-r border-zinc-800">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
        <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Live Dialogue</h2>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] text-zinc-500 font-mono">REC-5829</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
        {messages.map((msg, idx) => (
          <div key={msg.id} className="relative">
            <div className={cn(
              "flex gap-3 max-w-[90%]",
              msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
            )}>
              <div className={cn(
                "w-8 h-8 rounded shrink-0 flex items-center justify-center border",
                msg.role === 'user' ? "bg-zinc-800 border-zinc-700" : "bg-blue-900/20 border-blue-500/30"
              )}>
                {msg.role === 'user' ? <User size={16} className="text-zinc-400" /> : <Bot size={16} className="text-blue-400" />}
              </div>
              
              <div className={cn(
                "space-y-1",
                msg.role === 'user' ? "items-end" : "items-start"
              )}>
                <div className={cn(
                  "px-3 py-2 rounded-lg text-sm",
                  msg.role === 'user' 
                    ? "bg-zinc-800 text-zinc-200" 
                    : "bg-zinc-900 border border-zinc-800 text-zinc-300",
                  msg.isHandoff && "border-red-500/50 ring-1 ring-red-500/20"
                )}>
                  {msg.content}
                </div>
                <div className="text-[10px] text-zinc-500 font-mono px-1">
                  {msg.timestamp}
                </div>
              </div>
            </div>

            {msg.isHandoff && (
              <div className="mt-4 flex flex-col items-center">
                <div className="w-px h-4 bg-red-500/30" />
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-red-500/30 bg-red-500/10 text-red-500 text-[10px] font-bold uppercase tracking-wider">
                  <Headphones size={12} />
                  Operator Joined session
                </div>
                <div className="w-px h-4 bg-red-500/30" />
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3 mr-auto max-w-[90%]">
            <div className="w-8 h-8 rounded shrink-0 flex items-center justify-center border bg-blue-900/20 border-blue-500/30">
              <Bot size={16} className="text-blue-400" />
            </div>
            <div className="bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-lg flex gap-1">
              <motion.div 
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="w-1.5 h-1.5 rounded-full bg-zinc-600"
              />
              <motion.div 
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                className="w-1.5 h-1.5 rounded-full bg-zinc-600"
              />
              <motion.div 
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                className="w-1.5 h-1.5 rounded-full bg-zinc-600"
              />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-zinc-800 bg-zinc-900/30">
        <div className="relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <span className="text-zinc-600 text-[10px] font-mono">$</span>
          </div>
          <input 
            type="text" 
            placeholder="Type a message..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 pl-7 text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
          />
          <button 
            onClick={handleSend}
            className="absolute inset-y-0 right-2 flex items-center text-zinc-500 hover:text-zinc-300">
             <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
