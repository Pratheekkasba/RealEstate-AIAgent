import React, {
  useState, useRef, useEffect, useCallback, useMemo,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, X, Send, RotateCcw, ChevronDown,
  FileText, Database, Minus, Maximize2,
  CheckCircle, AlertTriangle, TrendingUp,
  Copy, Check,
} from 'lucide-react';
import { resolveQuery, SUGGESTED_QUESTIONS } from '../../services/assistant/briefEngine.js';

// ─── Constants ──────────────────────────────────────────────────────────────────
const TYPING_SPEED_MS    = 18;   // ms per character for the typewriter effect
const INITIAL_DELAY_MS   = 380;  // "thinking" pause before typing starts

// ─── Markdown-lite renderer ─────────────────────────────────────────────────────
// Converts **bold**, *italic*, • bullet lines, and ↳ indented lines to JSX.
function renderLine(line, key) {
  if (!line.trim()) return null;

  // Replace **bold** and *italic* inline
  const parts = [];
  let remaining = line;
  let idx = 0;

  const BOLD   = /\*\*(.+?)\*\*/;
  const ITALIC = /\*(.+?)\*/;

  while (remaining) {
    const bm = BOLD.exec(remaining);
    const im = ITALIC.exec(remaining);

    const firstMatch = [bm, im]
      .filter(Boolean)
      .sort((a, b) => a.index - b.index)[0];

    if (!firstMatch) {
      parts.push(<span key={idx++}>{remaining}</span>);
      break;
    }

    if (firstMatch.index > 0) {
      parts.push(<span key={idx++}>{remaining.slice(0, firstMatch.index)}</span>);
    }

    if (firstMatch === bm) {
      parts.push(<strong key={idx++} className="font-bold text-slate-800">{bm[1]}</strong>);
      remaining = remaining.slice(firstMatch.index + bm[0].length);
    } else {
      parts.push(<em key={idx++} className="italic text-slate-600">{im[1]}</em>);
      remaining = remaining.slice(firstMatch.index + im[0].length);
    }
  }

  // Detect bullet / indent
  const isBullet  = line.startsWith('• ') || line.startsWith('- ');
  const isIndent  = line.startsWith('  ↳') || line.startsWith('  •');
  const isHeading = /^\*\*.*\*\*$/.test(line.trim()) && !isBullet;

  if (isBullet) {
    return (
      <div key={key} className="flex gap-2 items-start">
        <span className="text-blue-400 mt-0.5 text-sm shrink-0">•</span>
        <span className="text-sm text-slate-700 leading-relaxed">{parts}</span>
      </div>
    );
  }
  if (isIndent) {
    return (
      <div key={key} className="pl-4 text-xs text-slate-500 leading-relaxed">{parts}</div>
    );
  }
  return (
    <p key={key} className="text-sm text-slate-700 leading-relaxed">{parts}</p>
  );
}

function MarkdownMessage({ text }) {
  const lines = text.split('\n').filter(l => l !== undefined);
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => renderLine(line, i))}
    </div>
  );
}

// ─── Typewriter hook ────────────────────────────────────────────────────────────
function useTypewriter(fullText, active) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone]           = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!active || !fullText) return;
    setDisplayed('');
    setDone(false);
    let i = 0;
    const tick = () => {
      i++;
      setDisplayed(fullText.slice(0, i));
      if (i < fullText.length) {
        timerRef.current = setTimeout(tick, TYPING_SPEED_MS);
      } else {
        setDone(true);
      }
    };
    timerRef.current = setTimeout(tick, INITIAL_DELAY_MS);
    return () => clearTimeout(timerRef.current);
  }, [fullText, active]);

  return { displayed, done };
}

// ─── Citation Pill ──────────────────────────────────────────────────────────────
function CitationPill({ citation, idx }) {
  return (
    <div className="flex items-start gap-2 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl">
      <span className="text-[9px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-full shrink-0 mt-0.5">
        [{idx + 1}]
      </span>
      <div className="min-w-0">
        <div className="text-[10px] font-mono text-slate-500 truncate">{citation.source}</div>
        <div className="text-[9px] text-slate-400 truncate">field: {citation.field}</div>
      </div>
    </div>
  );
}

// ─── Signal Banner ──────────────────────────────────────────────────────────────
function SignalBanner({ signal }) {
  if (!signal) return null;
  const map = {
    opportunity: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', icon: <CheckCircle className="w-3.5 h-3.5" />, label: '🟢 Opportunity Signal' },
    watch:       { bg: 'bg-amber-50 border-amber-200',   text: 'text-amber-700',   icon: <AlertTriangle className="w-3.5 h-3.5" />, label: '🟠 Monitor Closely' },
    risk:        { bg: 'bg-red-50 border-red-200',       text: 'text-red-700',     icon: <AlertTriangle className="w-3.5 h-3.5" />, label: '🔴 Risk Flag' },
  };
  const s = map[signal];
  if (!s) return null;
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold ${s.bg} ${s.text}`}>
      {s.icon} {s.label}
    </div>
  );
}

// ─── Message Bubble ─────────────────────────────────────────────────────────────
function AssistantMessage({ msg, isLatest }) {
  const fullText = msg.paragraphs.join('\n');
  const { displayed, done } = useTypewriter(
    isLatest ? fullText : fullText,
    isLatest
  );
  const [showCitations, setShowCitations] = useState(false);
  const [copied, setCopied] = useState(false);

  const textToShow = isLatest ? displayed : fullText;

  const copy = () => {
    navigator.clipboard?.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className="space-y-3"
    >
      {/* Signal banner */}
      {msg.signal && <SignalBanner signal={msg.signal} />}

      {/* Message content */}
      <div className="bg-white border border-slate-200/70 rounded-2xl rounded-tl-sm p-4 shadow-sm space-y-1.5">
        <MarkdownMessage text={textToShow} />
        {isLatest && !done && (
          <span className="inline-block w-1.5 h-4 bg-blue-500 animate-pulse rounded-sm ml-0.5 align-middle" />
        )}
      </div>

      {/* Footer actions */}
      {(done || !isLatest) && (
        <div className="flex items-center gap-2 px-1">
          <button
            onClick={copy}
            className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>

          {msg.citations?.length > 0 && (
            <button
              onClick={() => setShowCitations(v => !v)}
              className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-blue-600 transition-colors ml-auto"
            >
              <Database className="w-3 h-3" />
              {showCitations ? 'Hide' : 'View'} {msg.citations.length} source{msg.citations.length > 1 ? 's' : ''}
            </button>
          )}
        </div>
      )}

      {/* Citations */}
      <AnimatePresence>
        {showCitations && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-1.5 overflow-hidden"
          >
            {msg.citations.map((c, i) => <CitationPill key={i} citation={c} idx={i} />)}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── User Bubble ────────────────────────────────────────────────────────────────
function UserMessage({ text }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="flex justify-end"
    >
      <div className="bg-blue-600 text-white text-sm font-medium px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-[85%] leading-relaxed shadow-sm">
        {text}
      </div>
    </motion.div>
  );
}

// ─── Thinking Indicator ─────────────────────────────────────────────────────────
function ThinkingDots() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3 bg-white border border-slate-200/70 rounded-2xl rounded-tl-sm w-fit shadow-sm">
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-blue-400"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}

// ─── Suggestion Pills ───────────────────────────────────────────────────────────
function Suggestions({ onSelect }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
        Try asking
      </p>
      <div className="grid grid-cols-2 gap-1.5">
        {SUGGESTED_QUESTIONS.map(q => (
          <button
            key={q.label}
            onClick={() => onSelect(q.label)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-blue-50 border border-slate-200/70 hover:border-blue-200 rounded-xl text-left text-xs font-medium text-slate-600 hover:text-blue-700 transition-all leading-snug group"
          >
            <span className="text-sm shrink-0">{q.icon}</span>
            <span>{q.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Floating Assistant ────────────────────────────────────────────────────
/**
 * @param {object}  props
 * @param {object}  props.briefData   — Firestore daily_briefs/today document
 * @param {Array}   [props.archive]   — historical brief list
 */
export function AiBriefAssistant({ briefData, archive = [] }) {
  const [open,      setOpen]      = useState(false);
  const [minimised, setMinimised] = useState(false);
  const [messages,  setMessages]  = useState([]);   // { type: 'user'|'assistant', text?, paragraphs?, citations?, signal? }
  const [input,     setInput]     = useState('');
  const [thinking,  setThinking]  = useState(false);
  const [unread,    setUnread]    = useState(0);

  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  // Focus input on open
  useEffect(() => {
    if (open && !minimised) {
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [open, minimised]);

  // Unread badge
  useEffect(() => {
    if (!open) {
      const assistantMsgs = messages.filter(m => m.type === 'assistant');
      if (assistantMsgs.length > 0) setUnread(1);
    } else {
      setUnread(0);
    }
  }, [messages, open]);

  const submit = useCallback((questionOverride) => {
    const q = (questionOverride || input).trim();
    if (!q) return;

    setInput('');
    setMessages(prev => [...prev, { type: 'user', text: q }]);
    setThinking(true);

    // Simulate a short reasoning delay for UX, then resolve synchronously
    setTimeout(() => {
      const result = resolveQuery(q, briefData, archive);
      setMessages(prev => [...prev, { type: 'assistant', ...result }]);
      setThinking(false);
    }, INITIAL_DELAY_MS - 80);
  }, [input, briefData, archive]);

  const reset = () => {
    setMessages([]);
    setInput('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <>
      {/* ── Floating Trigger Button ── */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="w-[380px] flex flex-col bg-slate-50 border border-slate-200/80 rounded-3xl shadow-2xl shadow-slate-900/15 overflow-hidden"
              style={{ height: minimised ? 'auto' : '520px' }}
            >
              {/* ── Header ── */}
              <div className="flex items-center gap-3 px-4 py-3.5 bg-white border-b border-slate-100 shrink-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-sm">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-slate-800 leading-none">Brief Assistant</div>
                  <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                    {briefData ? '● Indexed from today\'s verified brief' : '○ Waiting for brief data'}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {messages.length > 0 && (
                    <button
                      onClick={reset}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Clear conversation"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => setMinimised(v => !v)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    {minimised ? <Maximize2 className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => setOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {!minimised && (
                <>
                  {/* ── Message Area ── */}
                  <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-5">
                    {/* Welcome message */}
                    {isEmpty && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                      >
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl rounded-tl-sm p-4 text-white text-sm leading-relaxed">
                          <p className="font-bold mb-1">Good morning. I'm your Brief Assistant.</p>
                          <p className="text-blue-100 text-xs leading-relaxed">
                            I answer questions using today's verified real estate intelligence. Every response is drawn directly from your Firestore brief — no guesses, no internet search.
                          </p>
                        </div>
                        {briefData && <Suggestions onSelect={q => submit(q)} />}
                        {!briefData && (
                          <div className="text-xs text-slate-400 text-center py-4">
                            Waiting for brief data to load…
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* Conversation */}
                    {messages.map((msg, idx) => (
                      msg.type === 'user'
                        ? <UserMessage key={idx} text={msg.text} />
                        : <AssistantMessage
                            key={idx}
                            msg={msg}
                            isLatest={idx === messages.length - 1}
                          />
                    ))}

                    {/* Thinking */}
                    {thinking && <ThinkingDots />}
                    <div ref={bottomRef} />
                  </div>

                  {/* ── Input Bar ── */}
                  <div className="px-3 pb-3 pt-2 bg-white border-t border-slate-100 shrink-0">
                    <div className="flex items-end gap-2 bg-slate-50 border border-slate-200/70 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-400/10 rounded-2xl px-3 py-2.5 transition-all">
                      <textarea
                        ref={inputRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKey}
                        placeholder="Ask about today's market…"
                        rows={1}
                        className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none resize-none leading-relaxed max-h-24"
                        style={{ fieldSizing: 'content' }}
                      />
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => submit()}
                        disabled={!input.trim() || thinking}
                        className={`p-1.5 rounded-xl transition-all shrink-0 ${
                          input.trim() && !thinking
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        <Send className="w-3.5 h-3.5" />
                      </motion.button>
                    </div>
                    <div className="flex items-center justify-between mt-1.5 px-1">
                      <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                        <FileText className="w-2.5 h-2.5" />
                        Sources: daily_briefs/today · {briefData?.projects?.length || 0} projects
                      </span>
                      <span className="text-[9px] text-slate-400 font-medium">↵ to send</span>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── FAB ── */}
        <motion.button
          onClick={() => { setOpen(v => !v); setUnread(0); }}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-700/30 flex items-center justify-center transition-shadow hover:shadow-2xl hover:shadow-blue-700/40"
          style={{ boxShadow: open ? '0 0 0 3px rgba(99,102,241,0.25)' : undefined }}
        >
          <AnimatePresence mode="wait">
            {open ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <ChevronDown className="w-6 h-6" />
              </motion.div>
            ) : (
              <motion.div
                key="open"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Sparkles className="w-6 h-6" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Unread badge */}
          <AnimatePresence>
            {unread > 0 && !open && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white"
              >
                {unread}
              </motion.span>
            )}
          </AnimatePresence>

          {/* Pulse ring when closed */}
          {!open && (
            <motion.span
              className="absolute inset-0 rounded-2xl border-2 border-blue-400 opacity-0"
              animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut' }}
            />
          )}
        </motion.button>
      </div>
    </>
  );
}

export default AiBriefAssistant;
