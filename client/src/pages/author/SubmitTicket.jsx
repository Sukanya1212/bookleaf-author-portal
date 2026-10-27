import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import { Send, Paperclip, HelpCircle, AlertCircle, CheckCircle2, BookOpen } from 'lucide-react';

export function SubmitTicket() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialBookId = searchParams.get('bookId') || 'general';

  const [books, setBooks] = useState([]);
  const [bookId, setBookId] = useState(initialBookId);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadBooks() {
      try {
        const res = await api.get('/author/books');
        setBooks(res.data.books || []);
      } catch (err) {
        console.error('Failed to load books dropdown', err);
      }
    }
    loadBooks();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAttachmentName(file.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!subject.trim()) {
      setError('Please provide a subject line for your query.');
      return;
    }
    if (!description.trim()) {
      setError('Please provide detailed information about your inquiry.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/author/tickets', {
        bookId: bookId === 'general' ? null : bookId,
        subject: subject.trim(),
        description: description.trim(),
        attachmentUrl: attachmentName ? `mock://attachments/${attachmentName}` : null
      });

      const newTicket = res.data.ticket;
      navigate(`/author/tickets?ticketId=${newTicket.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Submit a Support Query</h1>
        <p className="text-sm text-slate-500 mt-1">
          Our editorial, production, and accounts teams are here to assist you. Queries are automatically prioritized.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Form */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
          {error && (
            <div className="mb-6 flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Associated Book Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Which Book is this about?
              </label>
              <select
                value={bookId}
                onChange={(e) => setBookId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="general">General / Account Level Inquiry</option>
                {books.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title} ({b.bookId} • {b.status})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Selecting your book automatically provides your royalty and production milestones to our team.
              </p>
            </div>

            {/* Subject Line */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Subject Line
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                placeholder="e.g. Overdue quarterly royalty payout inquiry"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Detailed Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Detailed Description
              </label>
              <textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                placeholder="Please describe your query with as much detail as possible (e.g. specific dates, defect details, or discrepancies observed)..."
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              ></textarea>
            </div>

            {/* Optional File Attachment UI */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                File Attachment (Optional)
              </label>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 transition shadow-sm">
                  <Paperclip className="w-4 h-4 text-slate-500" />
                  <span>Choose File</span>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx"
                  />
                </label>
                {attachmentName ? (
                  <span className="text-xs text-emerald-700 font-medium bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                    📎 {attachmentName}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">
                    Useful for photos of defective print copies or royalty statements.
                  </span>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition shadow-sm disabled:opacity-50"
              >
                {loading ? 'Submitting & Classifying...' : 'Submit Support Ticket'}
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Helpful Policy Context Sidebar */}
        <div className="space-y-4">
          <div className="bg-emerald-50/60 rounded-xl border border-emerald-200 p-5 text-xs text-emerald-900 space-y-3">
            <h3 className="font-bold text-sm text-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              BookLeaf Policies Quick Reference
            </h3>
            
            <div className="space-y-2 text-[11px] leading-relaxed text-emerald-800">
              <p>
                <strong>• Royalties:</strong> 80/20 split on net profits. Calculated quarterly and paid within 45 days of quarter end (₹1,000 minimum threshold).
              </p>
              <p>
                <strong>• Print Quality:</strong> If misprints, binding issues, or color defects are found, BookLeaf provides free reprints upon photo verification within 5–7 days.
              </p>
              <p>
                <strong>• Channel Availability:</strong> New listings take 7–10 business days to go live. Stock sync issues are resolved within 24–48 hours.
              </p>
              <p>
                <strong>• Metadata Updates:</strong> Amazon/Flipkart synopsis updates take 3–5 business days.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
