import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Search, MessageSquare, Paperclip, CheckCheck, 
  User, Shield, Sparkles, Circle, ArrowLeft, RefreshCw 
} from 'lucide-react';
import { api } from '../services/api';

export default function ChatView({ currentUser, initialTargetUser = null }) {
  const [conversations, setConversations] = useState([]);
  const [activeUser, setActiveUser] = useState(initialTargetUser);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const pollingRef = useRef(null);

  // Load conversations list
  useEffect(() => {
    loadConversations();
    // Poll conversations every 4 seconds for new incoming messages
    pollingRef.current = setInterval(() => {
      loadConversations(false);
    }, 4000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // When activeUser changes, load their messages
  useEffect(() => {
    if (activeUser?.id) {
      loadMessages(activeUser.id);
    }
  }, [activeUser?.id]);

  // Set initial target user if provided from TeamDirectory
  useEffect(() => {
    if (initialTargetUser) {
      setActiveUser(initialTargetUser);
    }
  }, [initialTargetUser]);

  // Auto-scroll to bottom of message thread
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const convs = await api.getChatConversations();
      setConversations(convs);

      // If no active user yet, default to the first conversation
      if (!activeUser && convs.length > 0) {
        setActiveUser(convs[0].user);
      }
    } catch (err) {
      console.error('Error loading conversations:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const loadMessages = async (userId) => {
    try {
      const msgs = await api.getChatMessages(userId);
      setMessages(msgs);
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputMessage.trim() || !activeUser?.id || sending) return;

    const messageText = inputMessage.trim();
    setInputMessage('');
    setSending(true);

    try {
      const newMsg = await api.sendMessage({
        receiver_id: activeUser.id,
        channel: 'direct',
        message: messageText
      });

      setMessages((prev) => [...prev, newMsg]);
      // Refresh conversation summary
      loadConversations(false);
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Could not send message. Please verify connection.');
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = conversations.filter((c) => {
    const nameMatch = c.user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      c.user.email.toLowerCase().includes(searchTerm.toLowerCase());
    if (!nameMatch) return false;
    if (filterRole === 'all') return true;
    if (filterRole === 'managers') return c.user.role === 'manager';
    if (filterRole === 'employees') return c.user.role === 'employee';
    return true;
  });

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col pb-4 animate-in fade-in duration-300 select-none">
      
      {/* Top Page Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 font-['Outfit']">
            Direct Team Messages & Chat
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Instant communication between managers, developers, and team members.
          </p>
        </div>

        <button
          onClick={() => { loadConversations(); if (activeUser?.id) loadMessages(activeUser.id); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#e8e4da] text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Main Chat Box Container */}
      <div className="flex-1 min-h-0 bg-white rounded-3xl border border-[#e8e4da] shadow-sm flex overflow-hidden">
        
        {/* LEFT COLUMN: Team Conversations List */}
        <div className="w-80 border-r border-[#e8e4da] flex flex-col bg-[#faf8f4] shrink-0">
          
          {/* Search Bar */}
          <div className="p-3.5 border-b border-[#e8e4da] space-y-2">
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-[#e8e4da] shadow-xs">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search colleagues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none w-full"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1">
              {[
                { id: 'all', label: 'All' },
                { id: 'managers', label: 'Managers' },
                { id: 'employees', label: 'Teammates' }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterRole(f.id)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors ${
                    filterRole === f.id
                      ? 'bg-[#141518] text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-200 border border-[#e8e4da]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conversations Scrollable List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loading && conversations.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">Loading team chat...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">No matching conversations</div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = activeUser?.id === conv.user.id;
                return (
                  <button
                    key={conv.user.id}
                    onClick={() => {
                      setActiveUser(conv.user);
                      loadMessages(conv.user.id);
                    }}
                    className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors ${
                      isSelected
                        ? 'bg-white border-l-4 border-l-pink-500 shadow-xs'
                        : 'hover:bg-white/60'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={conv.user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                        alt={conv.user.full_name}
                        className="w-10 h-10 rounded-2xl object-cover ring-1 ring-slate-200"
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {conv.user.full_name}
                        </span>
                        {conv.last_message_at && (
                          <span className="text-[10px] text-slate-400 font-mono shrink-0">
                            {new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded ${
                          conv.user.role === 'manager'
                            ? 'bg-purple-100 text-purple-700'
                            : conv.user.role === 'admin'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {conv.user.role}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate">
                          {conv.user.department?.name || 'Central HQ'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-[11px] text-slate-500 truncate max-w-[170px]">
                          {conv.last_message || 'Start a direct conversation...'}
                        </p>
                        {conv.unread_count > 0 && (
                          <span className="w-4 h-4 rounded-full bg-pink-500 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Active Chat Thread */}
        {activeUser ? (
          <div className="flex-1 flex flex-col bg-white">
            
            {/* Chat Thread Header */}
            <div className="p-4 border-b border-[#e8e4da] bg-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={activeUser.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                    alt={activeUser.full_name}
                    className="w-11 h-11 rounded-2xl object-cover ring-1 ring-slate-200"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-900 font-['Outfit']">
                      {activeUser.full_name}
                    </h2>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      activeUser.role === 'manager'
                        ? 'bg-purple-100 text-purple-800'
                        : activeUser.role === 'admin'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {activeUser.role}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span>{activeUser.email}</span>
                    <span>•</span>
                    <span className="text-emerald-700 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active on Web
                    </span>
                  </div>
                </div>
              </div>

              {activeUser.github_username && (
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-mono">
                  <span>github: @{activeUser.github_username}</span>
                </div>
              )}
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#fbf9f5]">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-[#e8e4da] flex items-center justify-center text-slate-400 mb-3 shadow-xs">
                    <MessageSquare className="w-6 h-6 text-pink-500" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">
                    No messages with {activeUser.full_name} yet
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mt-1">
                    Send a direct message below to discuss task deliverables, code verification, or blockers.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isSender = msg.sender_id === currentUser.id;
                  const formattedTime = new Date(msg.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <div
                      key={msg.id}
                      className={`flex items-end gap-2.5 ${isSender ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isSender && (
                        <img
                          src={activeUser.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                          alt={activeUser.full_name}
                          className="w-7 h-7 rounded-xl object-cover ring-1 ring-slate-200 mb-1 shrink-0"
                        />
                      )}

                      <div className={`max-w-[78%] sm:max-w-[65%] rounded-2xl p-3.5 shadow-xs ${
                        isSender
                          ? 'bg-[#141518] text-white rounded-br-xs'
                          : 'bg-white text-slate-900 border border-[#e8e4da] rounded-bl-xs'
                      }`}>
                        <div className="text-xs whitespace-pre-wrap leading-relaxed">
                          {msg.message}
                        </div>

                        {msg.attachment_url && (
                          <div className={`mt-2 p-2 rounded-xl text-xs flex items-center gap-2 ${
                            isSender ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-700'
                          }`}>
                            <Paperclip className="w-3.5 h-3.5" />
                            <a
                              href={msg.attachment_url}
                              target="_blank"
                              rel="noreferrer"
                              className="underline truncate text-[11px]"
                            >
                              Attachment: {msg.attachment_url}
                            </a>
                          </div>
                        )}

                        <div className={`flex items-center justify-end gap-1.5 mt-1.5 text-[9px] ${
                          isSender ? 'text-slate-400' : 'text-slate-400'
                        }`}>
                          <span>{formattedTime}</span>
                          {isSender && (
                            <CheckCheck className={`w-3 h-3 ${msg.is_read ? 'text-pink-400' : 'text-slate-400'}`} />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Bar */}
            <form
              onSubmit={handleSendMessage}
              className="p-3.5 bg-white border-t border-[#e8e4da] flex items-center gap-2"
            >
              <input
                type="text"
                placeholder={`Message ${activeUser.full_name}... (Press Enter to send)`}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className="flex-1 bg-[#faf8f4] border border-[#e8e4da] rounded-2xl px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />

              <button
                type="submit"
                disabled={!inputMessage.trim() || sending}
                className="px-4 py-2.5 rounded-2xl bg-[#141518] hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm shrink-0"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white">
            <MessageSquare className="w-12 h-12 text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-slate-800 font-['Outfit']">
              Select a conversation to begin chatting
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              Connect directly with engineering leads, product managers, or marketing specialists in real-time.
            </p>
          </div>
        )}

      </div>

    </div>
  );
}
