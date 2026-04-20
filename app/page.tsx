"use client";

import { useCallback, useRef, useState } from "react";

interface RequestResult {
  id: string;
  timestamp: string;
  status: number;
  allowed: boolean;
  remaining?: number;
  message?: string;
}

interface Stats {
  config: { maxRequestsPerWindow: number; windowSeconds: number };
  summary: {
    totalUsers: number;
    totalRequests: number;
    totalBlocked: number;
  };
  users: Array<{
    userId: string;
    requestsInCurrentWindow: number;
    totalRequests: number;
    blockedRequests: number;
    remainingRequests: number;
  }>;
}

let requestCounter = 0;

export default function Home() {
  const [userId, setUserId] = useState("test-user");
  const [results, setResults] = useState<RequestResult[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const burstInProgress = useRef(false);

  const sendSingleRequest = useCallback(async (): Promise<RequestResult> => {
    const id = `req-${++requestCounter}`;
    try {
      const res = await fetch("/api/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, payload: { test: true } }),
      });
      const data = await res.json();
      return {
        id,
        timestamp: new Date().toLocaleTimeString(),
        status: res.status,
        allowed: res.status === 200,
        remaining: data.rateLimit?.remaining ?? data.currentRequests,
        message: data.message || data.error,
      };
    } catch {
      return {
        id,
        timestamp: new Date().toLocaleTimeString(),
        status: 500,
        allowed: false,
        message: "Network error",
      };
    }
  }, [userId]);

  const sendRequest = useCallback(async () => {
    const result = await sendSingleRequest();
    setResults((prev) => [result, ...prev.slice(0, 19)]);
  }, [sendSingleRequest]);

  const sendBurst = useCallback(
    async (count: number) => {
      if (burstInProgress.current) return;
      burstInProgress.current = true;
      setLoading(true);

      const promises = Array(count)
        .fill(null)
        .map(() => sendSingleRequest());
      const newResults = await Promise.all(promises);

      setResults((prev) => [...newResults, ...prev].slice(0, 20));
      setLoading(false);
      burstInProgress.current = false;
    },
    [sendSingleRequest],
  );

  const fetchStats = useCallback(async () => {
    const res = await fetch("/api/stats");
    const data = await res.json();
    setStats(data);
  }, []);

  const clearResults = () => setResults([]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8 font-mono">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Rate Limiter Test Dashboard</h1>
        <p className="text-zinc-400 mb-8">
          5 requests per user per minute (sliding window)
        </p>

        {/* Controls */}
        <div className="bg-zinc-900 rounded-lg p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                User ID
              </label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 w-48"
              />
            </div>
            <button
              onClick={sendRequest}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-medium"
            >
              Send 1 Request
            </button>
            <button
              onClick={() => sendBurst(3)}
              disabled={loading}
              className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded font-medium disabled:opacity-50"
            >
              Send 3 Concurrent
            </button>
            <button
              onClick={() => sendBurst(7)}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-medium disabled:opacity-50"
            >
              Send 7 (Trigger Limit)
            </button>
            <button
              onClick={fetchStats}
              className="bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded font-medium"
            >
              Refresh Stats
            </button>
            <button
              onClick={clearResults}
              className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded font-medium"
            >
              Clear Log
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Request Log */}
          <div className="bg-zinc-900 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Request Log</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.length === 0 ? (
                <p className="text-zinc-500">No requests yet</p>
              ) : (
                results.map((r) => (
                  <div
                    key={r.id}
                    className={`p-3 rounded text-sm ${
                      r.allowed
                        ? "bg-green-900/30 border border-green-800"
                        : "bg-red-900/30 border border-red-800"
                    }`}
                  >
                    <div className="flex justify-between">
                      <span className="font-medium">
                        {r.allowed ? "✓ ALLOWED" : "✗ BLOCKED"}
                      </span>
                      <span className="text-zinc-400">{r.timestamp}</span>
                    </div>
                    <div className="text-zinc-400 mt-1">
                      Status: {r.status} |{" "}
                      {r.allowed
                        ? `Remaining: ${r.remaining}`
                        : `Retry after window`}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="bg-zinc-900 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Server Stats</h2>
            {!stats ? (
              <p className="text-zinc-500">
                Click &quot;Refresh Stats&quot; to load
              </p>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-800 p-3 rounded">
                    <div className="text-2xl font-bold">
                      {stats.summary.totalRequests}
                    </div>
                    <div className="text-zinc-400 text-sm">Total Requests</div>
                  </div>
                  <div className="bg-zinc-800 p-3 rounded">
                    <div className="text-2xl font-bold text-red-400">
                      {stats.summary.totalBlocked}
                    </div>
                    <div className="text-zinc-400 text-sm">Blocked</div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-zinc-400 mb-2">
                    Users ({stats.summary.totalUsers})
                  </h3>
                  <div className="space-y-2">
                    {stats.users.map((u) => (
                      <div key={u.userId} className="bg-zinc-800 p-3 rounded">
                        <div className="font-medium">{u.userId}</div>
                        <div className="text-sm text-zinc-400">
                          Window: {u.requestsInCurrentWindow}/5 | Total:{" "}
                          {u.totalRequests} | Blocked: {u.blockedRequests}
                        </div>
                        <div className="mt-2 h-2 bg-zinc-700 rounded overflow-hidden">
                          <div
                            className={`h-full ${
                              u.requestsInCurrentWindow >= 5
                                ? "bg-red-500"
                                : "bg-green-500"
                            }`}
                            style={{
                              width: `${(u.requestsInCurrentWindow / 5) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 text-zinc-500 text-sm">
          <p>
            <strong>Test scenarios:</strong>
          </p>
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li>Send 5 requests → all should pass</li>
            <li>Send 6th request → should be blocked (429)</li>
            <li>Wait 60 seconds → oldest request expires, new ones allowed</li>
            <li>Change User ID → fresh rate limit for new user</li>
            <li>
              Send 7 concurrent → tests atomicity (exactly 5 pass, 2 blocked)
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
