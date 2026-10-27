import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/client';
import { PriorityBadge, StatusBadge, CategoryBadge } from '../../components/Badges';
import {
  ArrowLeft,
  Sparkles,
  Send,
  Edit3,
  RefreshCw,
  User,
  BookOpen,
  DollarSign,
  Lock,
  Paperclip,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export function TicketDetail() {
  const { id } = useParams();

  const [ticket, setTicket] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [replyMessage, setReplyMessage] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('In Progress');
  const [sendingReply, setSendingReply] = useState(false);

  // Internal Note state
  const [noteText, setNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // Overrides state
  const [categoryOverride, setCategoryOverride] = useState('');
  const [priorityOverride, setPriorityOverride] = useState('');
  const [statusOverride, setStatusOverride] = useState('');
  const [assignedAdminId, setAssignedAdminId] = useState('');
  const [savingOverrides, setSavingOverrides] = useState(false);
  const [regeneratingDraft, setRegeneratingDraft] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState('');

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/tickets/${id}`);
      const t = res.data.ticket;
      setTicket(t);
      setAdmins(res.data.admins || []);

      setCategoryOverride(t.category);
      setPriorityOverride(t.priority);
      setStatusOverride(t.status);
      setAssignedAdminId(t.assignedToAdminId || '');

      // Pre-fill reply with AI draft if empty
      if (t.aiDraftResponse && !replyMessage) {
        setReplyMessage(t.aiDraftResponse);
      }
    } catch (err) {
      console.error('Failed to load ticket details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [id]);

  // Real-Time SSE listener for incoming replies from the author
  useEffect(() => {
    if (!id) return;
    const eventSource = new EventSource(`/api/sse/tickets/${id}`);

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'NEW_MESSAGE') {
          setTicket((prev) => {
            if (!prev) return prev;
            const exists = prev.messages?.some(m => m.id === payload.data.id);
            if (exists) return prev;
            return {
              ...prev,
              messages: [...(prev.messages || []), payload.data]
            };
          });
        }
      } catch (e) {
        console.error('SSE ticket parse error:', e);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [id]);

  // Save admin overrides (Category, Priority, Status, Assignee)
  const handleSaveOverrides = async () => {
    setSavingOverrides(true);
    try {
      const res = await api.patch(`/admin/tickets/${id}`, {
        category: categoryOverride,
        priority: priorityOverride,
        status: statusOverride,
        assignedToAdminId: assignedAdminId || null
      });
      setTicket((prev) => ({ ...prev, ...res.data.ticket }));
      setFeedbackNotice('Ticket metadata & overrides updated.');
      setTimeout(() => setFeedbackNotice(''), 3500);
    } catch (err) {
      alert('Failed to update overrides.');
    } finally {
      setSavingOverrides(false);
    }
  };

  // Regenerate AI Draft
  const handleRegenerateDraft = async () => {
    setRegeneratingDraft(true);
    try {
      const res = await api.post(`/admin/tickets/${id}/regenerate-draft`);
      setTicket((prev) => ({ ...prev, aiDraftResponse: res.data.aiDraftResponse }));
      setReplyMessage(res.data.aiDraftResponse);
      setFeedbackNotice('AI Draft regenerated with fresh context.');
      setTimeout(() => setFeedbackNotice(''), 3500);
    } catch (err) {
      alert('Failed to regenerate AI draft.');
    } finally {
      setRegeneratingDraft(false);
    }
  };

  // Send official reply to author
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    setSendingReply(true);
    try {
      const res = await api.post(`/admin/tickets/${id}/messages`, {
        message: replyMessage.trim(),
        newStatus: selectedStatus
      });

      setTicket((prev) => ({
        ...prev,
        status: res.data.newStatus,
        messages: [...(prev.messages || []), res.data.message]
      }));
      setStatusOverride(res.data.newStatus);
      setFeedbackNotice('Response sent! Author view has updated in real time.');
      setTimeout(() => setFeedbackNotice(''), 4000);
    } catch (err) {
      alert('Failed to send response.');
    } finally {
      setSendingReply(false);
    }
  };

  // Add internal note
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    setAddingNote(true);
    try {
      const res = await api.post(`/admin/tickets/${id}/notes`, {
        note: noteText.trim()
      });
      setTicket((prev) => ({
        ...prev,
        internalNotes: [res.data.note, ...(prev.internalNotes || [])]
      }));
      setNoteText('');
    } catch (err) {
      alert('Failed to add internal note.');
    } finally {
      setAddingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex justify-center items-center text-xs text-slate-500">
        <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mr-3"></div>
        Loading ticket triage environment...
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500 text-sm">
        Ticket not found. <Link to="/admin/queue" className="text-emerald-600 font-semibold underline">Back to queue</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/queue"
            className="p-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition"
            title="Return to Queue"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                {ticket.ticketNumber}
              </span>
              <PriorityBadge priority={ticket.priority} />
              <StatusBadge status={ticket.status} />
              {ticket.isOverridden && (
                <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-medium">
                  Override Active
                </span>
              )}
            </div>
            <h1 className="text-lg font-bold text-slate-900 mt-1 leading-snug">
              {ticket.subject}
            </h1>
          </div>
        </div>

        {feedbackNotice && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg animate-fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{feedbackNotice}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: Triage, AI Draft, Response Editor & Discussion */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 1. Author Original Query Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-[10px]">
                  {ticket.author?.name.charAt(0)}
                </div>
                <span className="font-bold text-slate-900">{ticket.author?.name}</span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-500">{ticket.author?.email}</span>
              </div>
              <span className="text-slate-400 text-[10px]">
                {new Date(ticket.createdAt).toLocaleString()}
              </span>
            </div>

            <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
              {ticket.description}
            </p>

            {ticket.attachmentUrl && (
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-600">
                <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                <span>Attachment: <strong>{ticket.attachmentUrl.replace('mock://attachments/', '')}</strong></span>
              </div>
            )}
          </div>

          {/* 2. AI Intelligence & Auto-Classification Card */}
          <div className="bg-gradient-to-r from-emerald-50/70 via-teal-50/40 to-white rounded-xl border border-emerald-200/80 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>AI Auto-Classification & Urgency Analysis</span>
              </div>
              <span className="text-[10px] text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded font-medium">
                Grounded via BookLeaf KB
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Classified Category</span>
                <span className="font-semibold text-slate-900">{ticket.category}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Assigned Priority</span>
                <span className="font-semibold text-slate-900">{ticket.priority}</span>
              </div>
            </div>

            {ticket.aiReasoning && (
              <div className="text-[11px] text-emerald-950/80 bg-white/80 p-2.5 rounded-lg border border-emerald-100">
                <strong>AI Reasoning:</strong> {ticket.aiReasoning}
              </div>
            )}
          </div>

          {/* 3. AI-Drafted Response Box */}
          {ticket.aiDraftResponse && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>AI-Drafted Response</span>
                  <span className="text-[10px] font-normal text-slate-500">
                    (Pre-calibrated with BookLeaf tone & exact book figures)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRegenerateDraft}
                    disabled={regeneratingDraft}
                    className="text-[11px] font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 transition"
                  >
                    <RefreshCw className={`w-3 h-3 ${regeneratingDraft ? 'animate-spin' : ''}`} />
                    Regenerate
                  </button>
                  <button
                    onClick={() => setReplyMessage(ticket.aiDraftResponse)}
                    className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 transition"
                  >
                    Insert Into Reply
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg text-xs text-slate-700 leading-relaxed font-mono whitespace-pre-wrap max-h-48 overflow-y-auto border border-slate-200">
                {ticket.aiDraftResponse}
              </div>
            </div>
          )}

          {/* 4. Official Response Composer */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Edit3 className="w-3.5 h-3.5 text-slate-500" />
              <span>Send Official Response to Author</span>
            </h3>

            <form onSubmit={handleSendReply} className="space-y-3">
              <textarea
                rows={6}
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Review and customize response before sending to author..."
                required
                className="w-full p-3.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans leading-relaxed"
              ></textarea>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500 font-medium">After sending, set status:</span>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="border border-slate-300 rounded-md px-2 py-1 text-xs bg-white font-medium"
                  >
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={sendingReply || !replyMessage.trim()}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sendingReply ? 'Transmitting...' : 'Send Response to Author'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* 5. Messages History Thread */}
          {ticket.messages && ticket.messages.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Conversation History ({ticket.messages.length})
              </h3>
              <div className="space-y-3">
                {ticket.messages.map((m) => {
                  const isAdmin = m.sender?.role === 'ADMIN';
                  return (
                    <div
                      key={m.id}
                      className={`p-4 rounded-xl border text-xs leading-relaxed ${
                        isAdmin
                          ? 'bg-emerald-50/40 border-emerald-200 text-slate-800'
                          : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-black/5">
                        <span className="font-bold flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-emerald-600' : 'bg-slate-700'}`}></span>
                          {isAdmin ? `${m.sender.name} (BookLeaf Ops)` : `${m.sender.name} (Author)`}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(m.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap">{m.message}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Metadata, Overrides, Context Cards & Internal Notes */}
        <div className="space-y-5">
          
          {/* Admin Management & Overrides Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100">
              Ticket Controls & Overrides
            </h3>

            <div className="space-y-3 text-xs">
              {/* Category Override */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Category (Override AI)
                </label>
                <select
                  value={categoryOverride}
                  onChange={(e) => setCategoryOverride(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white"
                >
                  <option value="Royalty & Payments">Royalty & Payments</option>
                  <option value="ISBN & Metadata Issues">ISBN & Metadata Issues</option>
                  <option value="Printing & Quality">Printing & Quality</option>
                  <option value="Distribution & Availability">Distribution & Availability</option>
                  <option value="Book Status & Production Updates">Book Status & Production Updates</option>
                  <option value="General Inquiry">General Inquiry</option>
                </select>
              </div>

              {/* Priority Override */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Priority Score (Override AI)
                </label>
                <select
                  value={priorityOverride}
                  onChange={(e) => setPriorityOverride(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white"
                >
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Ticket Status
                </label>
                <select
                  value={statusOverride}
                  onChange={(e) => setStatusOverride(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white"
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              {/* Assignee */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Assigned Team Member
                </label>
                <select
                  value={assignedAdminId}
                  onChange={(e) => setAssignedAdminId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white"
                >
                  <option value="">Unassigned</option>
                  {admins.map((adm) => (
                    <option key={adm.id} value={adm.id}>
                      {adm.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleSaveOverrides}
                disabled={savingOverrides}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs transition shadow-sm"
              >
                {savingOverrides ? 'Saving...' : 'Save Ticket Metadata'}
              </button>
            </div>
          </div>

          {/* Book Performance Context */}
          {ticket.book ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                <span>Book Context</span>
              </h3>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="font-bold text-slate-900 block">{ticket.book.title}</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    ID: {ticket.book.bookId} • ISBN: {ticket.book.isbn || 'Pending'}
                  </span>
                </div>

                <div className="pt-1">
                  <span className="text-[10px] text-slate-400 block uppercase">Status</span>
                  <span className="font-medium text-slate-800">{ticket.book.status}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Copies Sold</span>
                    <span className="font-bold text-slate-900">{ticket.book.totalCopiesSold}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Royalty / Copy</span>
                    <span className="font-bold text-slate-900">₹{ticket.book.authorRoyaltyPerCopy || 0}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Earned</span>
                    <span className="font-bold text-slate-900">₹{ticket.book.totalRoyaltyEarned?.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Pending</span>
                    <span className="font-bold text-amber-700">₹{ticket.book.royaltyPending?.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {ticket.book.lastRoyaltyPayoutDate && (
                  <p className="text-[10px] text-slate-500">
                    Last payout: {ticket.book.lastRoyaltyPayoutDate}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-xs text-slate-500">
              This ticket is an account-level / general query with no specific book attached.
            </div>
          )}

          {/* Author Profile */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>Author Profile</span>
            </h3>

            <div className="text-xs space-y-1.5 text-slate-600">
              <p>
                <strong className="text-slate-900">{ticket.author?.name}</strong>{' '}
                <span className="text-[10px] text-slate-400">({ticket.author?.authorId})</span>
              </p>
              <p>{ticket.author?.email}</p>
              <p>{ticket.author?.phone || 'No phone recorded'}</p>
              <p>{ticket.author?.city} • Joined {ticket.author?.joinedDate}</p>
              <p className="text-[10px] text-slate-400 pt-1">
                {ticket.author?.books?.length || 0} registered titles in catalog
              </p>
            </div>
          </div>

          {/* Internal Notes (Invisible to Author) */}
          <div className="bg-amber-50/50 rounded-xl border border-amber-200 shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-amber-200">
              <h3 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-700" />
                <span>Internal Team Notes</span>
              </h3>
              <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                Admin Only
              </span>
            </div>

            <form onSubmit={handleAddNote} className="space-y-2">
              <textarea
                rows={2}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Leave internal operations note..."
                className="w-full p-2 text-xs border border-amber-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
              ></textarea>
              <button
                type="submit"
                disabled={addingNote || !noteText.trim()}
                className="w-full py-1.5 bg-amber-700 hover:bg-amber-800 text-white font-semibold rounded text-xs transition disabled:opacity-50"
              >
                {addingNote ? 'Adding...' : 'Add Internal Note'}
              </button>
            </form>

            {ticket.internalNotes && ticket.internalNotes.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-amber-200/60 max-h-48 overflow-y-auto">
                {ticket.internalNotes.map((n) => (
                  <div key={n.id} className="bg-white p-2.5 rounded-lg border border-amber-200 text-xs text-slate-800 space-y-1">
                    <p className="text-[11px] leading-relaxed">{n.note}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>{n.admin?.name}</span>
                      <span>{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
