import React, { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { db, auth } from './services/firebase/firebase.js';
import LoginPage from './pages/Auth/LoginPage.jsx';

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
import { AiBriefAssistant } from './components/assistant/AiBriefAssistant.jsx';
import { PageSkeleton } from './components/ui/SkeletonCard.jsx';
import { EmptyState } from './components/ui/EmptyState.jsx';
import { SettingsPage } from './pages/Settings/SettingsPage.jsx';

export default function App() {
  // Navigation State
  const [page, setPage] = useState('brief');
  const [adminMode, setAdminMode] = useState(false);
  const [adminPage, setAdminPage] = useState('overview');

  // Auth State
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // City & Search State
  const [selectedCity, setSelectedCity]   = useState(() => {
    try {
      const saved = localStorage.getItem('re_broker_prefs');
      return saved ? JSON.parse(saved).defaultCity || 'Pune' : 'Pune';
    } catch {
      return 'Pune';
    }
  });

  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('re_broker_profile');
      return saved ? JSON.parse(saved) : {
        name: 'Pratheek Kasba',
        agency: 'Antigravity Real Estate',
        license: 'RERA-P-022062604',
        email: 'pratheek@antigravity.in',
        preferredLocalities: 'Baner, Wakad, Hinjewadi',
        favouriteBuilders: 'Lodha Group, Vilas Javdekar'
      };
    } catch {
      return {
        name: 'Pratheek Kasba',
        agency: 'Antigravity Real Estate',
        license: 'RERA-P-022062604',
        email: 'pratheek@antigravity.in',
        preferredLocalities: 'Baner, Wakad, Hinjewadi',
        favouriteBuilders: 'Lodha Group, Vilas Javdekar'
      };
    }
  });
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

  // Firebase Auth State Observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('[Sign Out Error]', err);
    }
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
    if (page === 'settings') {
      return <SettingsPage onSave={(p, prefs) => {
        setProfile(p);
        if (prefs?.defaultCity) {
          setSelectedCity(prefs.defaultCity);
        }
      }} />;
    }

    if (selectedCity !== 'Pune') {
      return (
        <EmptyState
          icon="locality"
          title={`${selectedCity} Intelligence is Compiling`}
          body={`No verified market briefings have been generated for ${selectedCity} during this cycle. The intelligence engine is currently indexing Pune.`}
          action={
            <button
              onClick={() => setSelectedCity('Pune')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Switch back to Pune
            </button>
          }
        />
      );
    }

    switch (page) {
      case 'brief':
        return (
          <TodayBrief
            briefData={briefData}
            watchlist={watchlist}
            toggleWatchlist={toggleWatchlist}
            setPage={setPage}
            setSelectedLocality={setSelectedLocality}
            profile={profile}
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
      default:
        return null;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 gap-3 text-slate-400">
        <svg className="animate-spin h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Initializing Session...</span>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      {/* Sidebar */}
      <div className="print:hidden flex shrink-0">
        <Sidebar
          page={page}
          setPage={setPage}
          adminMode={adminMode}
          setAdminMode={setAdminMode}
          adminPage={adminPage}
          setAdminPage={setAdminPage}
          onSignOut={handleSignOut}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* Top Navigation */}
        <div className="print:hidden">
          <TopNavigation
            selectedCity={selectedCity}
            setSelectedCity={setSelectedCity}
            onOpenSearch={() => setSearchOpen(true)}
            onTriggerRefresh={handleRefresh}
            isRefreshing={isRefreshing}
          />
        </div>

        {/* Search Modal */}
        <SearchOverlay
          open={searchOpen && !adminMode}
          onClose={() => setSearchOpen(false)}
          data={briefData || {}}
          setPage={setPage}
          setSelectedLocality={setSelectedLocality}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 print:p-0">
          {/* Page Header breadcrumb */}
          {!adminMode && (
            <div className="mb-6 print:hidden">
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

          {/* Loading State — structured skeleton matching actual page layout */}
          {loading ? (
            <PageSkeleton />
          ) : error ? (
            <EmptyState
              icon="error"
              variant="error"
              title="Failed to connect to Firestore"
              body={error}
              onRetry={handleRefresh}
            />
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

      {/* ── Floating AI Brief Assistant — visible in customer mode only ── */}
      {!adminMode && !loading && (
        <div className="print:hidden">
          <AiBriefAssistant
            briefData={briefData}
            archive={archiveBriefs}
          />
        </div>
      )}
    </div>
  );
}
