import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { PriorityBadge, StatusBadge, CategoryBadge } from '../../components/Badges';
import { Search, Filter, AlertTriangle, Clock, RefreshCw, UserCheck, ShieldAlert, ArrowUpDown, ChevronRight } from 'lucide-react';

export function TicketQueue() {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('urgency');

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (categoryFilter !== 'all') params.category = categoryFilter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (sortBy) params.sortBy = sortBy;

      const res = await api.get('/admin/tickets', { params });
      setTickets(res.data.tickets);
      setStats(res.data.stats);
    } catch (err) {
      console.error('Failed to load tickets queue', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [statusFilter, categoryFilter, priorityFilter, sortBy]);

  // Real-Time SSE Listener for new tickets arriving
  useEffect(() => {
    const eventSource = new EventSource('/api/sse/admin');

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'TICKET_CREATED') {
          // Play subtle alert and refresh queue
          fetchQueue();
        }
      } catch (e) {
        console.error('SSE admin parse error:', e);
      }
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchQueue();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Page Header & Stats Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Operations Support Queue</h1>
            <span className="text-[10px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded">
              BookLeaf Ops
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            AI-classified and prioritized support queries across all authors.
          </p>
        </div>

        <button
          onClick={fetchQueue}
          className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg shadow-sm transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Queue
        </button>
      </div>

      {/* KPI Counters */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Queries</span>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
            <p className="text-xs text-slate-400 mt-0.5">{stats.openCount} currently Open</p>
          </div>

          <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl shadow-sm">
            <div className="flex items-center justify-between text-rose-700">
              <span className="text-xs font-semibold uppercase tracking-wider">Critical & High</span>
              <ShieldAlert className="w-4 h-4 text-rose-600" />
            </div>
            <p className="text-2xl font-bold text-rose-900 mt-1">
              {stats.criticalCount + stats.highCount}
            </p>
            <p className="text-xs text-rose-700 mt-0.5">Requires priority resolution</p>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl shadow-sm">
            <div className="flex items-center justify-between text-amber-700">
              <span className="text-xs font-semibold uppercase tracking-wider">In Progress</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-amber-900 mt-1">{stats.inProgressCount}</p>
            <p className="text-xs text-amber-700 mt-0.5">Under active review</p>
          </div>

          <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700">Resolved / Closed</span>
            <p className="text-2xl font-bold text-indigo-900 mt-1">{stats.resolvedCount}</p>
            <p className="text-xs text-indigo-700 mt-0.5">Successfully concluded</p>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="md:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Author, Subject, or Ticket #..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </form>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="all">All Categories</option>
              <option value="Royalty & Payments">Royalty & Payments</option>
              <option value="ISBN & Metadata Issues">ISBN & Metadata</option>
              <option value="Printing & Quality">Printing & Quality</option>
              <option value="Distribution & Availability">Distribution</option>
              <option value="Book Status & Production Updates">Production Updates</option>
              <option value="General Inquiry">General Inquiry</option>
            </select>
          </div>

          {/* Priority Filter & Sorting */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium text-slate-700"
            >
              <option value="urgency">⚡ Sort: Urgency & Oldest</option>
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets Table / List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center items-center text-xs text-slate-500">
            <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mr-2"></div>
            Loading operations queue...
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No tickets match your filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">Urgency / Ticket</th>
                  <th className="py-3.5 px-4">Subject & Author</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Assigned To</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tickets.map((t) => {
                  return (
                    <tr
                      key={t.id}
                      className={`hover:bg-slate-50/80 transition ${
                        t.priority === 'Critical' && t.status !== 'Resolved'
                          ? 'bg-rose-50/20'
                          : ''
                      }`}
                    >
                      {/* Urgency Indicators & Ticket # */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {t.isUrgent && t.status !== 'Resolved' && t.status !== 'Closed' && (
                            <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" title="High Urgency" />
                          )}
                          <span className="font-mono font-bold text-slate-800">
                            {t.ticketNumber}
                          </span>
                        </div>
                        {t.isStale && (
                          <span className="inline-block text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-semibold mt-1">
                            ⚠️ Stale ({t.ageHours}h unresolved)
                          </span>
                        )}
                      </td>

                      {/* Subject & Author details */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-bold text-slate-900 line-clamp-1">{t.subject}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span className="font-medium text-slate-700">{t.author?.name}</span>
                          <span>•</span>
                          <span>{t.book ? t.book.title : 'General Account'}</span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <CategoryBadge category={t.category} />
                      </td>

                      {/* Priority */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <PriorityBadge priority={t.priority} />
                        {t.isOverridden && (
                          <span className="block text-[10px] text-slate-400 mt-0.5">
                            (Overridden by admin)
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge status={t.status} />
                      </td>

                      {/* Assigned Admin */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                        {t.assignedToAdmin ? (
                          <span className="font-medium text-slate-800">{t.assignedToAdmin.name}</span>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <Link
                          to={`/admin/tickets/${t.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition shadow-sm"
                        >
                          <span>Review</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
