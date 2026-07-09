import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Settings, User, MapPin, Bell, ShieldCheck,
  Mail, MessageSquare, Database, Save, CheckCircle,
} from 'lucide-react';

export function SettingsPage() {
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('re_broker_profile');
      return saved ? JSON.parse(saved) : {
        name: 'Pratheek Kasba',
        agency: 'Antigravity Real Estate',
        license: 'RERA-P-022062604',
        email: 'pratheek@antigravity.in',
      };
    } catch {
      return { name: 'Pratheek Kasba', agency: 'Antigravity Real Estate', license: 'RERA-P-022062604', email: 'pratheek@antigravity.in' };
    }
  });

  const [preferences, setPreferences] = useState(() => {
    try {
      const saved = localStorage.getItem('re_broker_prefs');
      return saved ? JSON.parse(saved) : {
        defaultCity: 'Pune',
        emailBriefing: true,
        pushAlerts: true,
        onlyRera: true,
        theme: 'light',
      };
    } catch {
      return { defaultCity: 'Pune', emailBriefing: true, pushAlerts: true, onlyRera: true, theme: 'light' };
    }
  });

  const [savedMessage, setSavedMessage] = useState(false);

  const saveSettings = () => {
    localStorage.setItem('re_broker_profile', JSON.stringify(profile));
    localStorage.setItem('re_broker_prefs', JSON.stringify(preferences));
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-sm space-y-8 max-w-4xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            Broker Settings
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure your client briefing templates, default localities, and RERA verification preferences.
          </p>
        </div>

        <button
          onClick={saveSettings}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          {savedMessage ? (
            <>
              <CheckCircle className="w-3.5 h-3.5" />
              Saved!
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              Save Changes
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Column 1: Profile & Agency */}
        <div className="space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
            <User className="w-4 h-4 text-slate-400" />
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Broker Profile</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Full Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={e => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-blue-400 focus:bg-white rounded-xl text-sm text-slate-700 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Agency / Brokerage Name</label>
              <input
                type="text"
                value={profile.agency}
                onChange={e => setProfile({ ...profile, agency: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-blue-400 focus:bg-white rounded-xl text-sm text-slate-700 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">MahaRERA License Number</label>
              <input
                type="text"
                value={profile.license}
                onChange={e => setProfile({ ...profile, license: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-blue-400 focus:bg-white rounded-xl text-sm font-mono text-slate-700 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Business Email Address</label>
              <input
                type="email"
                value={profile.email}
                onChange={e => setProfile({ ...profile, email: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-blue-400 focus:bg-white rounded-xl text-sm text-slate-700 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Column 2: Dashboard Preferences */}
        <div className="space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
            <MapPin className="w-4 h-4 text-slate-400" />
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Dashboard Preferences</h3>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Default Workspace City</label>
              <select
                value={preferences.defaultCity}
                onChange={e => setPreferences({ ...preferences, defaultCity: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-blue-400 focus:bg-white rounded-xl text-sm text-slate-700 outline-none transition-all"
              >
                <option value="Pune">Pune</option>
                <option value="Mumbai">Mumbai (Preview)</option>
                <option value="Bangalore">Bangalore (Preview)</option>
              </select>
            </div>

            {/* Email toggle */}
            <div className="flex items-start justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
              <div className="flex gap-3">
                <Mail className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-700">Daily Email Briefing</div>
                  <div className="text-[10px] text-slate-400 leading-snug mt-0.5">
                    Receive today's verified real estate index in your inbox at 8:00 AM every morning.
                  </div>
                </div>
              </div>
              <button
                onClick={() => setPreferences({ ...preferences, emailBriefing: !preferences.emailBriefing })}
                className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 shrink-0 ${
                  preferences.emailBriefing ? 'bg-blue-600' : 'bg-slate-200'
                }`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 transform ${
                  preferences.emailBriefing ? 'translate-x-4' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* Push toggle */}
            <div className="flex items-start justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
              <div className="flex gap-3">
                <Bell className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-700">Desktop Push Notifications</div>
                  <div className="text-[10px] text-slate-400 leading-snug mt-0.5">
                    Get live desktop alerts when new launches or major price changes occur.
                  </div>
                </div>
              </div>
              <button
                onClick={() => setPreferences({ ...preferences, pushAlerts: !preferences.pushAlerts })}
                className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 shrink-0 ${
                  preferences.pushAlerts ? 'bg-blue-600' : 'bg-slate-200'
                }`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 transform ${
                  preferences.pushAlerts ? 'translate-x-4' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* RERA toggle */}
            <div className="flex items-start justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
              <div className="flex gap-3">
                <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-700">Filter Non-RERA Projects</div>
                  <div className="text-[10px] text-slate-400 leading-snug mt-0.5">
                    Strict mode: display only RERA registered projects. Excludes unverified developer pre-launches.
                  </div>
                </div>
              </div>
              <button
                onClick={() => setPreferences({ ...preferences, onlyRera: !preferences.onlyRera })}
                className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 shrink-0 ${
                  preferences.onlyRera ? 'bg-blue-600' : 'bg-slate-200'
                }`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 transform ${
                  preferences.onlyRera ? 'translate-x-4' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default SettingsPage;
