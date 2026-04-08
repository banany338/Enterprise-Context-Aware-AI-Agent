import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Upload, Send, Bot, User, Loader2, Database } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
}

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const resetInput = () => {
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    try {
      const response = await axios.post('http://localhost:8000/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert(`Success! Uploaded ${response.data.filename}. Created ${response.data.chunks_created} vector chunks.`);
    } catch (error) {
      console.error(error);
      alert('HTTP Error: Failed to upload document check backend console.');
    } finally {
      setIsUploading(false);
      resetInput();
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');

    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsThinking(true);

    try {
      const response = await axios.post('http://localhost:8000/chat', { question: userMessage });
      setMessages(prev => [...prev, { role: 'ai', content: response.data.answer }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'ai', content: 'Connection Error: Unable to reach the backend.' }]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900 w-full overflow-hidden">

      {/* Sidebar - Enterprise Knowledge Base */}
      <div className="w-80 bg-gray-900 text-gray-100 flex flex-col shadow-2xl z-20 shrink-0">
        <div className="p-6 border-b border-gray-800 flex items-center gap-3 shrink-0">
          <Database className="w-6 h-6 text-blue-400" />
          <h1 className="text-xl font-bold tracking-wide">Knowledge Base</h1>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <h2 className="text-xs uppercase text-gray-500 font-semibold mb-4 tracking-wider">Document Integration</h2>

          <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-5 flex flex-col items-center justify-center text-center gap-3">
            <div className="bg-gray-700/50 p-3 rounded-full mb-1">
              <Upload className="w-6 h-6 text-blue-400" />
            </div>
            <p className="text-sm text-gray-300">Upload your PDF documents to expand the AI's corporate context.</p>

            <input
              type="file"
              accept=".pdf"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileUpload}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full mt-3 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:text-blue-200 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-all shadow-lg active:scale-[0.98]"
            >
              {isUploading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Indexing vector...</>
              ) : (
                <>Select PDF File</>
              )}
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-gray-800 text-xs text-gray-500 text-center flex items-center justify-center gap-2">
          <span>Powered by FastAPI & RAG Core</span>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col relative h-full w-full">

        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 scroll-smooth">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 animate-in fade-in duration-700">
              <div className="w-20 h-20 bg-white shadow-sm rounded-full flex items-center justify-center mb-6">
                <Bot className="w-10 h-10 text-blue-500" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-700 mb-3">Enterprise AI Assistant</h2>
              <p className="max-w-md text-[15px] leading-relaxed">
                Connect your unstructured documents on the left, then ask complex questions here.
                I operate deterministically and strictly based on the provided context.
              </p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                <div className={`flex gap-4 max-w-3xl ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>

                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-sm border ${msg.role === 'user'
                    ? 'bg-blue-50 border-blue-100 text-blue-600'
                    : 'bg-white border-gray-200 text-gray-600'
                    }`}>
                    {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                  </div>

                  <div className={`px-5 py-4 rounded-2xl shadow-sm text-[15px] leading-relaxed break-words ${msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-sm border border-blue-700'
                    : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
                    }`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Thinking Skeleton */}
          {isThinking && (
            <div className="flex justify-start animate-in fade-in duration-300">
              <div className="flex gap-4 max-w-3xl flex-row">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white border border-gray-200 text-gray-600 flex items-center justify-center shadow-sm">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="px-5 py-4 rounded-2xl shadow-sm bg-white border border-gray-200 text-gray-500 rounded-tl-sm flex items-center gap-3">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  <span className="text-sm font-medium animate-pulse">Running vector search & generation...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} className="h-4" />
        </div>

        <div className="p-4 sm:p-6 bg-transparent w-full">
          <div className="max-w-4xl mx-auto relative group">
            <form onSubmit={handleSendMessage} className="relative flex items-center w-full shadow-lg rounded-full bg-white border border-gray-200 transition-shadow group-focus-within:border-blue-400 group-focus-within:shadow-xl group-focus-within:ring-4 ring-blue-50">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me a question about your uploaded documents..."
                className="w-full pl-6 pr-14 py-4 rounded-full bg-transparent focus:outline-none text-[15px] text-gray-800 placeholder-gray-400"
                disabled={isThinking}
                autoFocus
              />
              <button
                type="submit"
                disabled={!input.trim() || isThinking}
                className="absolute right-2 p-2.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95 flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <div className="text-center mt-3 text-xs font-medium text-gray-400">
              Secure internal deployment. Content is not used for generalized training.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
