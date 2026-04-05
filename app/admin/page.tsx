'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminDashboard() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch data from Supabase
  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from('feedback_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setLogs(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
    
    // OPTIONAL: Set up real-time listener
    const subscription = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'feedback_logs' }, 
      (payload) => {
        setLogs((prev) => [payload.new, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(subscription) };
  }, []);

  // Calculate quick stats
  const totalReviews = logs.filter(l => l.type === 'review_start').length;
  const intercepted = logs.filter(l => l.type === 'complaint_intercepted').length;
  const receipts = logs.filter(l => l.type === 'receipt_verified').length;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-10 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black italic text-slate-900">BoostBuddy <span className="text-orange-500 underline">HQ</span></h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-2">Live Store Monitoring: Cafe_123</p>
          </div>
          <button onClick={fetchLogs} className="bg-white border-2 border-slate-200 px-4 py-2 rounded-xl font-bold text-sm hover:bg-slate-100 transition-all">
            🔄 Refresh
          </button>
        </header>

        {/* STATS STRIP */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-sm">
            <p className="text-slate-400 font-black text-xs uppercase">Review Pipeline</p>
            <h2 className="text-5xl font-black text-orange-500">{totalReviews}</h2>
            <p className="text-slate-500 text-sm font-medium mt-1">Drafts started by happy users</p>
          </div>
          <div className="bg-slate-900 p-6 rounded-3xl shadow-xl">
            <p className="text-slate-400 font-black text-xs uppercase">Firewall Saves</p>
            <h2 className="text-5xl font-black text-red-400">{intercepted}</h2>
            <p className="text-slate-300 text-sm font-medium mt-1">Negative reviews blocked locally</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-sm">
            <p className="text-slate-400 font-black text-xs uppercase">Verified Sales</p>
            <h2 className="text-5xl font-black text-blue-500">{receipts}</h2>
            <p className="text-slate-500 text-sm font-medium mt-1">AI-confirmed visits today</p>
          </div>
        </div>

        {/* LIVE ACTIVITY TABLE */}
        <div className="bg-white rounded-3xl border-2 border-slate-100 overflow-hidden shadow-sm">
          <div className="bg-slate-50 p-6 border-b border-slate-100">
            <h3 className="font-black text-xl text-slate-800">Live Activity Feed</h3>
          </div>
          
          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="p-20 text-center animate-pulse font-bold text-slate-300 text-2xl">LOADING FEED...</div>
            ) : logs.length === 0 ? (
              <div className="p-20 text-center text-slate-400">No activity yet. Scan a QR code!</div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="p-6 flex items-start justify-between hover:bg-slate-50 transition-all">
                  <div className="flex gap-4">
                    <div className={`mt-1 w-3 h-3 rounded-full shrink-0 ${
                      log.type.includes('complaint') ? 'bg-red-500 animate-ping' : 
                      log.type.includes('receipt') ? 'bg-blue-500' : 'bg-green-500'
                    }`} />
                    <div>
                      <p className="font-bold text-slate-800 text-lg uppercase tracking-tight">{log.type.replace('_', ' ')}</p>
                      <p className="text-slate-600 font-medium italic">"{log.content}"</p>
                      <p className="text-slate-400 text-xs mt-2 font-bold">{new Date(log.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  {log.rating && (
                    <div className="bg-slate-100 px-3 py-1 rounded-lg font-black text-slate-600">
                      {log.rating}⭐
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}