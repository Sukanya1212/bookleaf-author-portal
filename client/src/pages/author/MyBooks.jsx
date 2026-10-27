import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { BookOpen, DollarSign, ShoppingBag, Clock, HelpCircle, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';

export function MyBooks() {
  const [books, setBooks] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBooks() {
      try {
        const res = await api.get('/author/books');
        setBooks(res.data.books);
        setSummary(res.data.summary);
      } catch (err) {
        console.error('Failed to load books', err);
      } finally {
        setLoading(false);
      }
    }
    fetchBooks();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 flex justify-center items-center">
        <div className="flex items-center gap-3 text-slate-500 text-sm">
          <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading catalog and royalty metrics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Published Catalog</h1>
          <p className="text-sm text-slate-500 mt-1">
            Overview of your published titles, production progress, and quarterly royalty earnings.
          </p>
        </div>
        <Link
          to="/author/submit"
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg shadow-sm transition"
        >
          <HelpCircle className="w-4 h-4" />
          Raise Support Query
        </Link>
      </div>

      {/* Summary KPI Metrics */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Titles</span>
              <BookOpen className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{summary.totalBooks}</p>
            <p className="text-xs text-slate-500 mt-1">
              {summary.publishedCount} Live • {summary.inProductionCount} in Production
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Copies Sold</span>
              <ShoppingBag className="w-4 h-4 text-sky-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {summary.totalCopiesSold.toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-slate-500 mt-1">Across all retail channels</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Earned</span>
              <DollarSign className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">
              ₹{summary.totalRoyaltyEarned.toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              ₹{summary.royaltyPaid.toLocaleString('en-IN')} paid to date
            </p>
          </div>

          <div className={`p-5 rounded-xl border shadow-sm ${
            summary.royaltyPending >= 1000 ? 'bg-amber-50/60 border-amber-300' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">Pending Payout</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">
              ₹{summary.royaltyPending.toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-amber-700 mt-1">
              {summary.royaltyPending >= 1000
                ? 'Threshold met (₹1,000+). Queued for quarterly payout.'
                : 'Under ₹1,000 threshold (rolls over to next quarter)'}
            </p>
          </div>
        </div>
      )}

      {/* Book Cards Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Book Details & Sales Breakdown</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {books.map((book) => {
            const isLive = book.status === 'Published & Live';
            const inProduction = book.status.startsWith('In Production');

            return (
              <div
                key={book.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between hover:border-slate-300 transition"
              >
                {/* Book Header */}
                <div className="p-6 pb-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                        {book.bookId}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 mt-1.5 leading-snug">
                        {book.title}
                      </h3>
                      <p className="text-xs text-slate-500">{book.genre || 'General Fiction'}</p>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                        isLive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {book.status}
                    </span>
                  </div>

                  {/* Metadata Row */}
                  <div className="grid grid-cols-2 gap-2 py-3 my-2 text-xs border-y border-slate-100 text-slate-600">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">ISBN</span>
                      <span className="font-mono font-medium">{book.isbn || 'Pending Assignment'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Publication Date</span>
                      <span>{book.publicationDate || 'In Production Workflow'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">MRP / Retail</span>
                      <span className="font-semibold text-slate-900">
                        {book.mrp ? `₹${book.mrp}` : 'To be determined'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Print Partner</span>
                      <span>{book.printPartner || 'BookLeaf Delhi Facility'}</span>
                    </div>
                  </div>

                  {/* Performance / Edge Case Logic */}
                  {isLive ? (
                    <div className="bg-slate-50 rounded-lg p-3 text-xs space-y-2 mt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Copies Sold</span>
                        <span className="font-bold text-slate-900">{book.totalCopiesSold}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Royalty per copy</span>
                        <span className="font-semibold text-slate-700">₹{book.authorRoyaltyPerCopy}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Total Royalty Earned</span>
                        <span className="font-bold text-slate-900">₹{book.totalRoyaltyEarned?.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                        <span className="text-slate-600">Paid to Bank</span>
                        <span className="text-emerald-700 font-semibold">₹{book.royaltyPaid?.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex items-center justify-between font-semibold">
                        <span className="text-amber-800">Pending Disbursement</span>
                        <span className="text-amber-800 font-bold">₹{book.royaltyPending?.toLocaleString('en-IN')}</span>
                      </div>
                      {book.lastRoyaltyPayoutDate && (
                        <p className="text-[10px] text-slate-400 text-right pt-1">
                          Last payout date: {book.lastRoyaltyPayoutDate}
                        </p>
                      )}
                    </div>
                  ) : (
                    /* In-Production Edge Case Card */
                    <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3.5 text-xs text-amber-900 space-y-1.5 mt-3">
                      <div className="flex items-center gap-1.5 font-bold text-amber-800">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                        <span>Book Currently in Production Workflow</span>
                      </div>
                      <p className="text-[11px] text-amber-700 leading-relaxed">
                        Sales metrics and royalty calculations will activate once your book completes typesetting, proofreading, and retail platform distribution.
                      </p>
                    </div>
                  )}

                  {/* Available Channels */}
                  {book.availableOn && book.availableOn.length > 0 && (
                    <div className="mt-3">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                        Live Channels
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {book.availableOn.map((platform, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200"
                          >
                            {platform}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Action */}
                <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    Need support with this title?
                  </span>
                  <Link
                    to={`/author/submit?bookId=${book.id}`}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1"
                  >
                    Raise Query for {book.bookId} →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
