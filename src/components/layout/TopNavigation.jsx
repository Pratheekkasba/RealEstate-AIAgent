import React, { useState } from 'react';
import { Search, Bell, RefreshCw, ChevronDown, Check } from 'lucide-react';

export function TopNavigation({ 
  selectedCity, 
  setSelectedCity, 
  searchQuery, 
  setSearchQuery, 
  onTriggerRefresh,
  isRefreshing
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const cities = ["Pune", "Mumbai", "Bangalore"];

  const todayStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between shadow-sm shadow-slate-100 shrink-0 sticky top-0 z-40">
      
      {/* Left: City Selector & Date */}
      <div className="flex items-center gap-6">
        <div className="relative">
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg text-sm border border-slate-200/60 transition-all"
          >
            📍 {selectedCity}
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
          
          {dropdownOpen && (
            <div className="absolute left-0 mt-1.5 w-40 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-100">
              {cities.map(city => (
                <button
                  key={city}
                  onClick={() => {
                    setSelectedCity(city);
                    setDropdownOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  {city}
                  {selectedCity === city && <Check className="w-4 h-4 text-blue-600" />}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <span className="text-xs font-semibold text-slate-400 border-l border-slate-200 pl-6 hidden sm:inline">
          {todayStr}
        </span>
      </div>

      {/* Center: Search Bar */}
      <div className="flex-1 max-w-md mx-6 relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search projects, builders, localities..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-1.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-sm transition-all outline-none"
        />
      </div>

      {/* Right: Refresh button, Alerts, profile */}
      <div className="flex items-center gap-4">
        {/* Refresh button */}
        <button
          onClick={onTriggerRefresh}
          disabled={isRefreshing}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
            isRefreshing 
              ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-blue-50 hover:bg-blue-100/80 border-blue-100 text-blue-600 hover:text-blue-700'
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing Engine...' : 'Refresh Engine'}
        </button>

        {/* Notifications Icon Placeholder */}
        <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg relative transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
        </button>

        {/* Profile Avatar Placeholder */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center border border-slate-200/80 shadow-sm">
            PB
          </div>
        </div>
      </div>
    </header>
  );
}

export default TopNavigation;
