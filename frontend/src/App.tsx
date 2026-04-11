import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Upload, Send, Bot, User, Loader2, Database, BrainCircuit, FileText, Trash2 } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  sources?: string[];
  chunks?: { text: string; score: number; source: string }[];
}

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [intelligence, setIntelligence] = useState(3);

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

  const handleClearDB = async () => {
    if (!confirm('Are you heavily sure you want to clear the entire knowledge base? This action purges all uploaded vectors and cannot be undone.')) return;

    setIsClearing(true);
    try {
      await axios.delete('http://localhost:8000/clear');
      alert('Knowledge base purged. The LLM has no memory of these files anymore.');
      setMessages([]); // Wipe frontend memory to align with backend memory
    } catch (error) {
      console.error(error);
      alert('Network Error: Failed to purge the knowledge base.');
    } finally {
      setIsClearing(false);
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
      const response = await axios.post('http://localhost:8000/chat', {
        question: userMessage,
        intelligence: intelligence
      });
      setMessages(prev => [...prev, {
        role: 'ai',
        content: response.data.answer,
        sources: response.data.sources,
        chunks: response.data.chunks
      }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'ai', content: 'Connection Error: Unable to reach the backend.' }]);
    } finally {
      setIsThinking(false);
    }
  };

  const lastAiMessage = [...messages].reverse().find(m => m.role === 'ai');
  const activeChunks = lastAiMessage?.chunks || [];

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900 w-full overflow-hidden">

      {/* Left Sidebar */}
      <div className="w-[320px] bg-gray-900 text-gray-100 flex flex-col shadow-2xl z-20 shrink-0">
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

            <div className="w-full mt-5 pt-4 border-t border-gray-700/50 text-left">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs text-gray-300 font-medium tracking-wide">Search Intelligence</label>
                <span className="text-xs bg-blue-900/50 text-blue-300 px-1.5 py-0.5 rounded font-mono border border-blue-800">{intelligence}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={intelligence}
                onChange={(e) => setIntelligence(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <p className="text-[10px] text-gray-500 mt-2 leading-snug">
                Higher intelligence retrieves more distinct chunks of context, improving deeper knowledge but using more tokens.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 pt-0 mt-auto">
          <button
            onClick={handleClearDB}
            disabled={isClearing || isUploading || isThinking}
            className="w-full flex items-center justify-center gap-2 bg-red-900/20 hover:bg-red-900/40 border border-red-900/30 text-red-400 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium py-2 px-4 rounded-lg transition-all"
          >
            {isClearing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Clear Database
          </button>
        </div>

        <div className="p-4 border-t border-gray-800 text-xs text-gray-500 text-center flex items-center justify-center gap-2">
          <span>Powered by FastAPI & RAG Core</span>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col relative h-full w-full bg-white shadow-xl z-10 border-r border-gray-200">

        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 scroll-smooth bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed opacity-95">
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
                <div className={`flex gap-4 w-full md:max-w-[85%] 2xl:max-w-[95%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>

                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-sm border ${msg.role === 'user'
                      ? 'bg-blue-50 border-blue-100 text-blue-600'
                      : 'bg-indigo-50 border-indigo-100 text-indigo-600'
                    }`}>
                    {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                  </div>

                  <div className="flex flex-col gap-1 max-w-full">
                    <div className={`px-5 py-4 rounded-2xl shadow-sm text-[15px] leading-relaxed break-words ${msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-sm border border-blue-700'
                        : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
                      }`}>
                      {msg.content}
                    </div>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="flex gap-2 flex-wrap mt-1 px-1">
                        {msg.sources.map((src, i) => (
                          <span key={i} className="text-[11px] text-gray-500 bg-gray-100 px-2 py-1 rounded border border-gray-200 flex items-center gap-1">
                            <FileText className="w-3 h-3" /> {src}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}

          {isThinking && (
            <div className="flex justify-start animate-in fade-in duration-300">
              <div className="flex gap-4 w-full md:max-w-[85%] 2xl:max-w-[95%] flex-row">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white border border-gray-200 text-indigo-600 flex items-center justify-center shadow-sm">
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

        <div className="p-4 sm:p-6 bg-white w-full flex justify-center border-t border-gray-100 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.03)] z-10">
          <div className="w-full md:max-w-[85%] 2xl:max-w-[95%] relative group">
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

      {/* Right Panel - Brain Inspector */}
      <div className="w-[384px] bg-gray-50 flex flex-col shrink-0 border-l border-gray-200 z-0 hidden lg:flex">
        <div className="p-5 border-b border-gray-200 bg-white flex items-center gap-3 shrink-0 shadow-sm">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-gray-800 leading-tight">Brain Inspector</h2>
            <p className="text-[11px] text-gray-500 font-medium">Vector Search Results</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
          {activeChunks.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 flex items-center justify-center border border-dashed border-gray-300">
                <BrainCircuit className="w-6 h-6 text-gray-300" />
              </div>
              <h3 className="text-sm font-semibold text-gray-600 mb-1">Awaiting Query</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                When the AI responds, the exact document coordinates and semantic similarity scores will be plotted here.
              </p>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
              {activeChunks.map((chunk, idx) => (
                <div key={idx} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col hover:border-indigo-300 transition-colors">
                  <div className="bg-gray-50 px-3 py-2 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span className="text-xs font-semibold text-gray-700 truncate" title={chunk.source}>
                        {chunk.source.split('/').pop()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded text-[10px] font-bold text-gray-600 border border-gray-200 shadow-sm shrink-0">
                      <span className={chunk.score < 1.0 ? "text-green-600" : "text-amber-600"}>
                        {chunk.score.toFixed(3)}
                      </span>
                      dist
                    </div>
                  </div>

                  <div className="p-3 text-[12px] text-gray-600 leading-relaxed relative">
                    <div className="absolute top-2 left-2 text-indigo-100">
                      <svg className="w-6 h-6 rotate-180 opacity-50" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21L16.09 13.203h-2.19l.711-2.923h2.189l.394-1.638c.683-2.845 2.502-3.864 4.544-3.864h2.261v3.238h-1.53c-1.077 0-1.423.826-1.621 1.637l-.394 1.627h3.181l-.851 2.922h-2.33l-2.071 8.5h-4.364zm-11 0l2.072-7.797h-2.19l.711-2.923h2.189l.394-1.638c.683-2.845 2.502-3.864 4.544-3.864h2.261v3.238h-1.53c-1.077 0-1.423.826-1.621 1.637l-.394 1.627h3.181l-.851 2.922h-2.33l-2.071 8.5h-4.364z" /></svg>
                    </div>
                    <div className="relative z-10 line-clamp-6 text-gray-600">
                      {chunk.text}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
