import React, { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from './services/firebase/firebase.js';

import Sidebar from './components/layout/Sidebar.jsx';
import TopNavigation from './components/layout/TopNavigation.jsx';
import SearchOverlay from './components/search/SearchOverlay.jsx';

import TodayBrief from './pages/Dashboard/TodayBrief.jsx';
import MarketOverview from './pages/Market/MarketOverview.jsx';
import ProjectsDirectory from './pages/Projects/ProjectsDirectory.jsx';
import LocalitiesDirectory from './pages/Localities/LocalitiesDirectory.jsx';
import WatchlistPage from './pages/Watchlist/WatchlistPage.jsx';
import BriefArchive from './pages/Archive/BriefArchive.jsx';
import DailyBriefView from './pages/DailyBrief/DailyBriefView.jsx';
import AdminConsole from './pages/Admin/AdminConsole.jsx';

export default function App() {
  // Navigation State
  const [page, setPage] = useState('brief');
  const [adminMode, setAdminMode] = useState(false);
  const [adminPage, setAdminPage] = useState('overview');

  // City & Search State
  const [selectedCity, setSelectedCity]   = useState('Pune');
  const [searchOpen,   setSearchOpen]     = useState(false);
  const [selectedLocality, setSelectedLocality] = useState('Baner');

  // Data State
  const [briefData, setBriefData] = useState(null);
  const [archiveBriefs, setArchiveBriefs] = useState([]);
  const [latestRun, setLatestRun] = useState(null);
  const [recentRuns, setRecentRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Watchlist State (localStorage persisted)
  const [watchlist, setWatchlist] = useState(() => {
    try {
      const saved = localStorage.getItem('re_watchlist');
      return saved ? JSON.parse(saved) : ['Baner', 'Wakad', 'Kharadi'];
    } catch {
      return ['Baner', 'Wakad', 'Kharadi'];
    }
  });

  // Persist watchlist
  useEffect(() => {
    localStorage.setItem('re_watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  const toggleWatchlist = useCallback((locality) => {
    setWatchlist(prev =>
      prev.includes(locality)
        ? prev.filter(l => l !== locality)
        : [...prev, locality]
    );
  }, []);

  // ── Global Cmd+K / Ctrl+K shortcut ────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Fetch today's brief and system run data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Today's Brief
      const todayRef = doc(db, 'daily_briefs', 'today');
      const todaySnap = await getDoc(todayRef);
      if (todaySnap.exists()) {
        setBriefData(todaySnap.data());
      }

      // 2. Brief Archive
      const archiveQ = query(
        collection(db, 'daily_briefs'),
        orderBy('date', 'desc'),
        limit(14)
      );
      const archiveSnap = await getDocs(archiveQ);
      const archiveDocs = archiveSnap.docs
        .map(d => d.data())
        .filter(d => d.date); // exclude 'today' doc (no date field)
      setArchiveBriefs(archiveDocs);

      // 3. Latest System Run (admin)
      const runRef = doc(db, 'system_runs', 'latest');
      const runSnap = await getDoc(runRef);
      if (runSnap.exists()) {
        setLatestRun(runSnap.data());
      }

      // 4. Recent runs history (admin)
      try {
        const runsQ = query(
          collection(db, 'system_runs'),
          orderBy('startTime', 'desc'),
          limit(10)
        );
        const runsSnap = await getDocs(runsQ);
        setRecentRuns(runsSnap.docs.map(d => d.data()).filter(d => d.runId !== 'latest'));
      } catch {
        // system_runs may not have startTime indexed yet
        setRecentRuns([]);
      }

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  }, [fetchData]);

  const handleOpenBrief = useCallback((brief) => {
    setBriefData(brief);
    setPage('daily-brief');
  }, []);

  // Page Title Mapping
  const pageTitles = {
    brief: "Today's Brief",
    market: "Market Intelligence",
    projects: "Projects Directory",
    localities: "Localities",
    watchlist: "Watchlist",
    archive: "Brief Archive",
    settings: "Settings",
    "daily-brief": "Daily Brief Report"
  };

  const renderCustomerPage = () => {
    switch (page) {
      case 'brief':
        return (
          <TodayBrief
            briefData={briefData}
            watchlist={watchlist}
            toggleWatchlist={toggleWatchlist}
            setPage={setPage}
            setSelectedLocality={setSelectedLocality}
          />
        );
      case 'market':
        return <MarketOverview briefData={briefData} />;
      case 'projects':
        return (
          <ProjectsDirectory
            briefData={briefData}
            watchlist={watchlist}
            toggleWatchlist={toggleWatchlist}
          />
        );
      case 'localities':
        return (
          <LocalitiesDirectory
            briefData={briefData}
            watchlist={watchlist}
            toggleWatchlist={toggleWatchlist}
            selectedLocality={selectedLocality}
            setSelectedLocality={setSelectedLocality}
          />
        );
      case 'watchlist':
        return (
          <WatchlistPage
            watchlist={watchlist}
            toggleWatchlist={toggleWatchlist}
            briefData={briefData}
            setPage={setPage}
            setSelectedLocality={setSelectedLocality}
          />
        );
      case 'archive':
        return (
          <BriefArchive
            briefs={archiveBriefs}
            onOpenBrief={handleOpenBrief}
          />
        );
      case 'daily-brief':
        return <DailyBriefView briefData={briefData} />;
      case 'settings':
        return (
          <div className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800 mb-2">⚙ Settings</h2>
            <p className="text-sm text-slate-400">Preferences and configuration options will be available here.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      {/* Sidebar */}
      <Sidebar
        page={page}
        setPage={setPage}
        adminMode={adminMode}
        setAdminMode={setAdminMode}
        adminPage={adminPage}
        setAdminPage={setAdminPage}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* Top Navigation */}
        <TopNavigation
          selectedCity={selectedCity}
          setSelectedCity={setSelectedCity}
          onOpenSearch={() => setSearchOpen(true)}
          onTriggerRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        {/* Search Modal */}
        <SearchOverlay
          open={searchOpen && !adminMode}
          onClose={() => setSearchOpen(false)}
          data={briefData || {}}
          setPage={setPage}
          setSelectedLocality={setSelectedLocality}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Page Header breadcrumb */}
          {!adminMode && (
            <div className="mb-6">
              <h1 className="text-2xl font-black text-slate-800">
                {pageTitles[page] || 'Dashboard'}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {selectedCity} Real Estate Intelligence • {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          )}

          {adminMode && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  🔧 Internal Admin Console
                </span>
              </div>
              <h1 className="text-2xl font-black text-slate-800">
                {adminPage.charAt(0).toUpperCase() + adminPage.slice(1)}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Operational telemetry from <span className="font-mono">system_runs</span> collection.
              </p>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-slate-200/50 animate-pulse rounded-3xl" />
              ))}
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-3xl p-8 text-center">
              <h3 className="font-bold text-lg mb-1">Failed to Connect to Firestore</h3>
              <p className="text-sm text-red-600">{error}</p>
              <button
                onClick={handleRefresh}
                className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Retry
              </button>
            </div>
          ) : adminMode ? (
            <AdminConsole
              latestRun={latestRun}
              recentRuns={recentRuns}
              adminPage={adminPage}
            />
          ) : (
            renderCustomerPage()
          )}
        </main>
      </div>
    </div>
  );
}
