import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../api/client';
import { PriorityBadge, StatusBadge, CategoryBadge } from '../../components/Badges';
import { MessageSquare, Send, Clock, BookOpen, User, ShieldCheck, Plus, RefreshCw, Paperclip } from 'lucide-react';

export function MyTickets() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedTicketId = searchParams.get('ticketId');

  const [tickets, setTickets] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [realtimeNotice, setRealtimeNotice] = useState('');

  const messagesEndRef = useRef(null);

  // 1. Load Author's Tickets
  const fetchTickets = async () => {
    try {
      const res = await api.get('/author/tickets');
      setTickets(res.data.tickets);

      // Select ticket from URL param or default to first
      if (res.data.tickets.length > 0) {
        const targetId = selectedTicketId || res.data.tickets[0].id;
        loadTicketDetail(targetId);
      }
    } catch (err) {
      console.error('Failed to load tickets', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTicketDetail = async (id) => {
    try {
      const res = await api.get(`/author/tickets/${id}`);
      setActiveTicket(res.data.ticket);
      setSearchParams({ ticketId: id });
    } catch (err) {
      console.error('Failed to load ticket detail', err);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // 2. Real-Time SSE Listener for the Active Ticket
  useEffect(() => {
    if (!activeTicket?.id) return;

    const eventSource = new EventSource(`/api/sse/tickets/${activeTicket.id}`);

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'NEW_MESSAGE') {
          setActiveTicket((prev) => {
            if (!prev || prev.id !== payload.ticketId) return prev;
            // Avoid duplicate message append
            const exists = prev.messages?.some(m => m.id === payload.data.id);
            if (exists) return prev;
            return {
              ...prev,
              messages: [...(prev.messages || []), payload.data]
            };
          });

          setRealtimeNotice('New response received in real time!');
          setTimeout(() => setRealtimeNotice(''), 4000);
        } else if (payload.type === 'STATUS_CHANGED') {
          setActiveTicket((prev) => prev ? { ...prev, status: payload.data.status } : prev);
          // Also update status in sidebar list
          setTickets((prev) =>
            prev.map(t => t.id === payload.ticketId ? { ...t, status: payload.data.status } : t)
          );
        }
      } catch (e) {
        console.error('Error parsing SSE event:', e);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [activeTicket?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeTicket?.messages]);

  // 3. Send Reply
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !activeTicket) return;

    setSending(true);
    try {
      const res = await api.post(`/author/tickets/${activeTicket.id}/messages`, {
        message: replyText.trim()
      });

      // Optimistically append message if not already added by SSE
      setActiveTicket((prev) => {
        const exists = prev.messages?.some(m => m.id === res.data.message.id);
        if (exists) return prev;
        return {
          ...prev,
          messages: [...(prev.messages || []), res.data.message]
        };
      });

      setReplyText('');
    } catch (err) {
      alert('Failed to send reply. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 flex justify-center items-center text-slate-500 text-sm">
        <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mr-3"></div>
        Loading support queries...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Support Tickets</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track communication with BookLeaf editors, production coordinators, and finance staff.
          </p>
        </div>
        <Link
          to="/author/submit"
          className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          New Query
        </Link>
      </div>

      {tickets.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-md mx-auto">
          <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No support tickets raised yet</h3>
          <p className="text-xs text-slate-500 mt-1 mb-6">
            If you have questions regarding your royalties, books in production, ISBN, or printing, our team is ready to help.
          </p>
          <Link
            to="/author/submit"
            className="inline-flex items-center gap-2 bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm hover:bg-emerald-700 transition"
          >
            Submit your first query
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Left Column: Tickets List */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Ticket History ({tickets.length})
              </span>
              <button
                onClick={fetchTickets}
                className="text-slate-400 hover:text-slate-600 p-1 rounded transition"
                title="Refresh list"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {tickets.map((t) => {
                const isSelected = activeTicket?.id === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => loadTicketDetail(t.id)}
                    className={`w-full text-left p-4 transition flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-emerald-50/70 border-l-4 border-emerald-600'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono font-bold text-slate-600">
                        {t.ticketNumber}
                      </span>
                      <StatusBadge status={t.status} />
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                      {t.subject}
                    </h4>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                      <span>{t.book ? t.book.title : 'General / Account'}</span>
                      <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Active Ticket Thread */}
          {activeTicket ? (
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[650px]">
              
              {/* Ticket Thread Header */}
              <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/60 rounded-t-xl">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                      {activeTicket.ticketNumber}
                    </span>
                    <CategoryBadge category={activeTicket.category} />
                    <StatusBadge status={activeTicket.status} />
                  </div>
                  <h2 className="text-base font-bold text-slate-900 leading-snug">
                    {activeTicket.subject}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                    <span>{activeTicket.book ? activeTicket.book.title : 'General Inquiry'}</span>
                    <span>•</span>
                    <span>Opened {new Date(activeTicket.createdAt).toLocaleDateString()}</span>
                  </p>
                </div>

                {/* Realtime Live Pulse Indicator */}
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    Live Sync Active
                  </div>
                </div>
              </div>

              {/* Real-time Notification Banner */}
              {realtimeNotice && (
                <div className="bg-emerald-600 text-white text-xs font-medium px-4 py-2 flex items-center justify-between animate-fade-in">
                  <span>{realtimeNotice}</span>
                  <span className="text-[10px] bg-emerald-700 px-1.5 py-0.5 rounded">Real-Time</span>
                </div>
              )}

              {/* Messages Discussion List */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                
                {/* 1. Original Author Query Box */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                      <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                        You
                      </div>
                      <span>Original Ticket Query</span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {new Date(activeTicket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {activeTicket.description}
                  </p>
                  {activeTicket.attachmentUrl && (
                    <div className="mt-3 pt-2 border-t border-slate-200 text-[11px] text-slate-500 flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                      <span>Attachment: {activeTicket.attachmentUrl.replace('mock://attachments/', '')}</span>
                    </div>
                  )}
                </div>

                {/* 2. Messages Thread */}
                {activeTicket.messages?.map((msg) => {
                  const isAdmin = msg.sender?.role === 'ADMIN';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl p-4 shadow-sm text-xs leading-relaxed ${
                          isAdmin
                            ? 'bg-white border border-slate-200 text-slate-800'
                            : 'bg-emerald-600 text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 mb-1.5 pb-1 border-b border-black/5">
                          <span className="font-bold flex items-center gap-1 text-[11px]">
                            {isAdmin && <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />}
                            {isAdmin ? 'BookLeaf Support Team' : 'You'}
                          </span>
                          <span className={`text-[10px] ${isAdmin ? 'text-slate-400' : 'text-emerald-100'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap">{msg.message}</p>
                      </div>
                    </div>
                  );
                })}

                <div ref={messagesEndRef} />
              </div>

              {/* Reply Input Bar */}
              <div className="p-4 border-t border-slate-200 bg-white rounded-b-xl">
                <form onSubmit={handleSendReply} className="flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type a follow-up message..."
                    className="flex-1 px-4 py-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={sending || !replyText.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition"
                  >
                    {sending ? 'Sending...' : 'Send'}
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
              Select a ticket on the left to view conversation.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
