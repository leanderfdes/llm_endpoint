// src/App.jsx
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Deployment note:
 * Set VITE_API_BASE_URL in your Vercel project settings (e.g. https://your-backend.onrender.com)
 * If not set, this falls back to the local dev backend: http://127.0.0.1:8000
 */
const RAW_API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
// remove trailing slash if present
const API_BASE_URL = RAW_API_BASE.replace(/\/+$/, "");

// === Example pool ===
const ALL_EXAMPLES = [
  "Write a short motivational quote about staying consistent as a developer.",
  "Explain what an API is in simple terms for a beginner.",
  "Give three bullet points on why logging is important in backend systems.",
  "Describe the difference between synchronous and asynchronous code with examples.",
  "Write a concise README section that explains how to run a FastAPI app locally.",
  "Suggest 5 good interview questions for a backend engineer role and short answers.",
  "Rewrite the following into a tweet: 'Logging helps detect issues early and saves debugging time.'",
  "Explain the concept of rate limiting and why it's important for APIs.",
  "Give three tips for writing clearer commit messages.",
  "List 3 ways to reduce latency in web APIs and a short explanation for each.",
  "Provide a short checklist for preparing a project for production deployment.",
  "How would you explain 'token' in LLMs to a non-technical person?",
  "Give 4 guardrails for safe LLM prompt engineering in a customer-facing app.",
  "What are the pros and cons of server-side rendering vs client-side rendering?",
  "Create a short elevator pitch for an LLM-based customer support assistant."
];

// Pick n unique random items from an array
function sampleUnique(arr, n, exclude = []) {
  const pool = arr.filter((x) => !exclude.includes(x));
  if (n >= pool.length) return [...pool];
  const out = [];
  const used = new Set();
  while (out.length < n) {
    const idx = Math.floor(Math.random() * pool.length);
    if (used.has(idx)) continue;
    used.add(idx);
    out.push(pool[idx]);
  }
  return out;
}

/**
 * Typewriter: simple controlled typewriter that reveals `text` at `msPerChar`.
 * - shows plain-text progressively
 * - calls onDone() when finished typing
 */
function Typewriter({ text = "", msPerChar = 10, onDone }) {
  const [pos, setPos] = useState(0);

  useEffect(() => {
    setPos(0);
    if (!text) {
      onDone?.();
      return;
    }

    let cancelled = false;
    const total = text.length;
    let i = 0;

    function step() {
      if (cancelled) return;
      i += 1;
      setPos(i);
      if (i >= total) {
        onDone?.();
        return;
      }
      timeout = setTimeout(step, msPerChar);
    }

    let timeout = setTimeout(step, msPerChar);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, msPerChar]);

  return (
    <div className="typewriter">
      <span>{text.slice(0, pos)}</span>
      <span className="typewriter-caret" />
    </div>
  );
}

function App() {
  const [prompt, setPrompt] = useState("");
  const [maxTokens, setMaxTokens] = useState(300);
  const [answer, setAnswer] = useState("");
  const [model, setModel] = useState("");
  const [usageTokens, setUsageTokens] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);

  // quick examples state: show 3 at a time
  const [examples, setExamples] = useState(() => sampleUnique(ALL_EXAMPLES, 3));

  // Typewriter & copy state
  const [typing, setTyping] = useState(false);
  const [typingSpeed] = useState(6); // ms per char
  const [copied, setCopied] = useState(false);

  // Refresh examples on mount (ensures randomness)
  useEffect(() => {
    setExamples(sampleUnique(ALL_EXAMPLES, 3));
  }, []);

  // Helper to rotate to new examples (optionally exclude current prompt)
  const rotateExamples = (excludePrompt = "") => {
    const newSet = sampleUnique(ALL_EXAMPLES, 3, excludePrompt ? [excludePrompt] : []);
    setExamples(newSet);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    setError("");
    setAnswer("");
    setModel("");
    setUsageTokens(null);
    setCopied(false);

    const trimmed = prompt.trim();
    if (!trimmed) {
      setError("Please enter a prompt before asking the model.");
      return;
    }

    setLoading(true);
    setTyping(false);

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmed, max_tokens: maxTokens }),
      });

      // handle non-json or network errors gracefully
      const contentType = res.headers.get("content-type") || "";
      const data = contentType.includes("application/json") ? await res.json() : null;

      if (!res.ok) {
        // prefer server-provided detail, else the whole body
        const detail =
          data && typeof data.detail === "string"
            ? data.detail
            : data && data.detail
            ? JSON.stringify(data.detail)
            : `Request failed with status ${res.status}`;
        throw new Error(detail || "Request failed");
      }

      const newAnswer = (data && data.answer) || "";
      const newModel = (data && data.model) || "";
      // backend returns usage_tokens as a single number (AskResponse)
      const newUsage = data && (data.usage_tokens ?? null);

      setAnswer(newAnswer);
      setModel(newModel);
      setUsageTokens(newUsage);

      setHistory((prev) => [
        { id: Date.now(), prompt: trimmed, answer: newAnswer },
        ...prev.slice(0, 4), // keep last 5
      ]);

      // start typing animation, then rotate examples when done
      setTyping(true);
    } catch (err) {
      // Network errors or thrown errors land here
      const msg = err?.message || "Something went wrong while contacting the API.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleUseExample = (text) => {
    setPrompt(text);
    setAnswer("");
    setError("");
    setCopied(false);
    setTyping(false);
  };

  const formatTokens = (n) =>
    n?.toLocaleString?.("en-IN", { maximumFractionDigits: 0 }) ?? n;

  const handleCopy = async () => {
    try {
      if (!answer) return;
      await navigator.clipboard.writeText(answer || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  // When typewriter finishes, rotate examples (exclude current prompt so it doesn't immediately reappear)
  const onTypingDone = () => {
    setTyping(false);
    rotateExamples(prompt);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-50">
      <main className="flex-1 px-1 pt-6 pb-20 md:pt-10 md:pb-28">
        <div
          className="w-full mx-1 grid gap-6
                    md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,320px)]"
        >
          {/* LEFT: prompt + controls */}
          <section className="bg-slate-900/80 border border-slate-800 rounded-3xl shadow-2xl shadow-slate-950/60 p-6 md:p-8 backdrop-blur">
            <header className="mb-6">
              <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live · Gemini-powered LLM API
              </div>
              <h1 className="mt-3 text-2xl md:text-3xl font-semibold tracking-tight">
                LLM Playground
              </h1>
              <p className="mt-1 text-sm md:text-base text-slate-400">
                Minimal client for your FastAPI + Gemini backend. Experiment with
                prompts, inspect responses, and iterate like an engineer.
              </p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-400 mb-2">
                  Prompt
                </label>
                <textarea
                  className="w-full h-32 md:h-40 resize-none rounded-2xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm md:text-base text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500 transition"
                  placeholder='Ask anything... e.g. "Write a two-line motivational quote about learning backend development."'
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                      Max tokens
                    </label>
                    <span className="text-xs text-slate-300">
                      <span className="font-semibold text-emerald-400">
                        {formatTokens(maxTokens)}
                      </span>{" "}
                      tokens
                    </span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={100000}
                    step={50}
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(Number(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="md:self-end inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/60 px-4 py-2.5 text-sm md:text-base font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 transition focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      Thinking...
                    </>
                  ) : (
                    <>
                      Ask model
                      <span className="text-lg">✨</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {error && (
              <div className="mt-4 rounded-2xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs md:text-sm text-red-200">
                {error}
              </div>
            )}

            <div className="mt-5">
              <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">
                Quick examples
              </p>
              <div className="flex flex-wrap gap-2">
                {examples.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => handleUseExample(ex)}
                    className="text-[11px] md:text-xs rounded-2xl border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-slate-300 hover:border-emerald-500/60 hover:text-emerald-100 transition"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* MIDDLE: Response panel */}
          <section className="bg-slate-900/70 border border-slate-800 rounded-3xl p-5 md:p-6 flex flex-col">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Response
              </h2>

              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                {model && (
                  <span className="px-2 py-1 rounded-full bg-slate-950/70 border border-slate-700">
                    {model}
                  </span>
                )}
                {usageTokens != null && (
                  <span className="px-2 py-1 rounded-full bg-slate-950/70 border border-slate-700">
                    {usageTokens} tokens
                  </span>
                )}
                <button
                  onClick={handleCopy}
                  className="copy-btn ml-1 inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/70 px-2 py-1 text-xs text-slate-300 hover:bg-slate-900/90"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            <div className="flex-1 rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm md:text-[15px] text-slate-100 whitespace-pre-wrap overflow-y-auto">
              {loading && !answer && !error && (
                <p className="text-slate-500 text-sm">Model is generating a response…</p>
              )}

              {/* Typewriter: show plain-type effect while typing */}
              {typing && answer && (
                <Typewriter text={answer} msPerChar={typingSpeed} onDone={onTypingDone} />
              )}

              {/* When typing finishes (typing === false) show rendered markdown */}
              {!typing && answer && !loading && (
                <div className="prose prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{answer}</ReactMarkdown>
                </div>
              )}

              {!loading && !answer && !error && (
                <p className="text-slate-500 text-sm">
                  Your answer will appear here. Submit a prompt to see what the model returns.
                </p>
              )}
            </div>
          </section>

          {/* RIGHT: Recent prompts */}
          <aside className="relative bg-slate-900/60 border border-slate-800 rounded-3xl p-4 md:p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Recent prompts
              </h3>
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={() => setHistory([])}
                  className="text-[11px] text-slate-500 hover:text-slate-300"
                >
                  Clear
                </button>
              )}
            </div>

            <ul className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              {history.length === 0 ? (
                <li className="text-xs text-slate-500">No recent prompts yet.</li>
              ) : (
                history.map((item) => (
                  <li
                    key={item.id}
                    className="group rounded-2xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-xs text-slate-300 hover:border-emerald-500/50 transition"
                  >
                    <button
                      type="button"
                      onClick={() => handleUseExample(item.prompt)}
                      className="text-left w-full"
                    >
                      <p className="line-clamp-2 text-slate-200 group-hover:text-emerald-100">
                        {item.prompt}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500 line-clamp-1">
                        {item.answer}
                      </p>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </aside>
        </div>
      </main>

      {/* Bottom meta */}
      <div className="w-full mt-10 pb-6 text-center text-[11px] md:text-xs text-slate-500 space-y-1 clear-both">
        <div>
          Built with <span className="text-slate-300">FastAPI · Gemini · React · Tailwind CSS</span>
        </div>
        <div className="text-slate-400">LLM Playground · Industry-ready LLM client UI</div>
      </div>
    </div>
  );
}

export default App;
