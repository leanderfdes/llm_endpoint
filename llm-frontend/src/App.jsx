// src/App.jsx
import { useState } from "react";

const API_BASE_URL = "http://127.0.0.1:8000"; // FastAPI backend

function App() {
  const [prompt, setPrompt] = useState("");
  const [maxTokens, setMaxTokens] = useState(300);
  const [answer, setAnswer] = useState("");
  const [model, setModel] = useState("");
  const [usageTokens, setUsageTokens] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setAnswer("");
    setModel("");
    setUsageTokens(null);

    const trimmed = prompt.trim();
    if (!trimmed) {
      setError("Please enter a prompt before asking the model.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: trimmed,
          max_tokens: maxTokens,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const detail =
          typeof data.detail === "string"
            ? data.detail
            : JSON.stringify(data.detail);
        throw new Error(detail || "Request failed");
      }

      const newAnswer = data.answer || "";
      const newModel = data.model || "";
      const newUsage = data.usage_tokens ?? null;

      setAnswer(newAnswer);
      setModel(newModel);
      setUsageTokens(newUsage);

      setHistory((prev) => [
        {
          id: Date.now(),
          prompt: trimmed,
          answer: newAnswer,
        },
        ...prev.slice(0, 4), // keep last 5
      ]);
    } catch (err) {
      setError(err.message || "Something went wrong while contacting the API.");
    } finally {
      setLoading(false);
    }
  };

  const handleUseExample = (text) => {
    setPrompt(text);
    setAnswer("");
    setError("");
  };

  // optional: format big token numbers with commas
  const formatTokens = (n) =>
    n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-50">
      {/* Main content */}
      <main className="flex-1 px-4 pt-6 pb-16 md:pt-10 md:pb-20">
        <div className="w-full max-w-5xl mx-auto grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">

          {/* Left: Input + controls */}
          <section className="bg-slate-900/80 border border-slate-800 rounded-3xl shadow-2xl shadow-slate-950/60 p-6 md:p-8 backdrop-blur">
            {/* Header */}
            <header className="mb-6">
              <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live · Gemini-powered LLM API
              </div>
              <h1 className="mt-3 text-2xl md:text-3xl font-semibold tracking-tight">
                LLM Playground
              </h1>
              <p className="mt-1 text-sm md:text-base text-slate-400">
                Minimal client for your FastAPI + Gemini backend. Experiment
                with prompts, inspect responses, and iterate like an engineer.
              </p>
            </header>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-400 mb-2">
                  Prompt
                </label>
                <textarea
                  className="w-full h-32 md:h-40 resize-none rounded-2xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm md:text-base text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500 transition"
                  placeholder="Ask anything... e.g. “Write a two-line motivational quote about learning backend development.”"
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

            {/* Error */}
            {error && (
              <div className="mt-4 rounded-2xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs md:text-sm text-red-200">
                {error}
              </div>
            )}

            {/* Examples */}
            <div className="mt-5">
              <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">
                Quick examples
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  "Write a short motivational quote about staying consistent as a developer.",
                  "Explain what an API is in simple terms for a beginner.",
                  "Give three bullet points on why logging is important in backend systems.",
                ].map((ex) => (
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

          {/* Right: Response + history */}
          <section className="space-y-4">
            {/* Response card */}
            <div className="h-full bg-slate-900/70 border border-slate-800 rounded-3xl p-5 md:p-6 flex flex-col">
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
                </div>
              </div>

              <div className="flex-1 rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm md:text-[15px] text-slate-100 whitespace-pre-wrap overflow-y-auto">
                {loading && !answer && !error && (
                  <p className="text-slate-500 text-sm">
                    Model is generating a response…
                  </p>
                )}
                {!loading && !answer && !error && (
                  <p className="text-slate-500 text-sm">
                    Your answer will appear here. Submit a prompt to see what
                    the model returns.
                  </p>
                )}
                {answer && !loading && <p>{answer}</p>}
              </div>
            </div>

            {/* History card */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-4 md:p-5">
              <div className="flex items-center justify-between mb-2">
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
              {history.length === 0 ? (
                <p className="text-xs text-slate-500">
                  Your last few prompts will be listed here for quick reuse.
                </p>
              ) : (
                <ul className="space-y-2 max-h-40 overflow-y-auto">
                  {history.map((item) => (
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
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      </main>

      <div className="w-full mt-10 pb-6 text-center text-[11px] md:text-xs text-slate-500 space-y-1">
        <div>
          Built with{" "}
          <span className="text-slate-300">
            FastAPI · Gemini · React · Tailwind CSS
          </span>
        </div>
        <div className="text-slate-400">
          LLM Playground · Industry-ready LLM client UI
        </div>
      </div>
    </div>
  );
}

export default App;
