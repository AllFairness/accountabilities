"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

type Professional = {
  id: string;
  name: string;
  profession: string;
  organization: string;
  color: string;
  cases: number;
  transparency: number;
  accountability: number;
  confidence: number;
};

const professions = [
  { name: "裁判官", color: "#6366f1" },
  { name: "弁護士", color: "#10b981" },
  { name: "医師", color: "#f59e0b" },
  { name: "公務員", color: "#ef4444" },
];

function clampPct(value: number) {
  return Math.max(0, Math.min(100, value));
}

export default function ProfessionalsPage() {
  const [data, setData] = useState<Professional[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetch_ = useCallback(async (pt: string | null) => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ limit: "500" });
      if (pt) p.set("profession_type", pt);
      const res = await fetch(`/api/professionals?${p}`);
      const json = await res.json();
      setData(json.data ?? []);
      setTotal(json.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch_(filter); }, [filter, fetch_]);

  const filtered = search
    ? data.filter(d => d.name.includes(search) || d.organization.includes(search))
    : data;

  return (
    <main className="min-h-screen bg-[#fafafa]">
      <header className="bg-white border-b border-[#e5e5e5] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">← マップに戻る</Link>
            <h1 className="text-xl font-bold text-[#0f172a] mt-1">プロフェッショナル一覧</h1>
            <p className="text-xs text-gray-400">{total.toLocaleString()} 件</p>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-6">
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setFilter(null)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === null ? "bg-gray-900 text-white" : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"}`}
          >
            すべて
          </button>
          {professions.map(p => (
            <button
              key={p.name}
              onClick={() => setFilter(filter === p.name ? null : p.name)}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors border"
              style={{ backgroundColor: filter === p.name ? p.color : "white", color: filter === p.name ? "white" : p.color, borderColor: p.color }}
            >
              {p.name}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="名前・所属で検索..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full mb-4 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#185FA5]"
        />

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#185FA5] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(p => (
              <Link
                key={p.id}
                href={`/professionals/${p.id}`}
                className="bg-white rounded-xl border border-[#e5e5e5] p-4 hover:shadow-md hover:border-[#bfdbfe] transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: p.color }}>
                    {p.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[#0f172a] truncate">{p.name}</div>
                    {p.organization && <div className="text-xs text-gray-500 truncate">{p.organization}</div>}
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white whitespace-nowrap" style={{ backgroundColor: p.color }}>
                    {p.profession}
                  </span>
                </div>
                <div className="mt-3 border-t border-gray-50 pt-3 space-y-2">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-500">関連案件: {p.cases.toLocaleString()} 件</span>
                  </div>
                  {p.transparency !== undefined && (
                    <>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="w-14 text-gray-500">透明性</span>
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#185FA5] rounded-full" style={{ width: `${clampPct(((p.transparency + 1) / 2) * 100)}%` }} />
                        </div>
                        <span className="w-8 text-right font-medium text-gray-700">{p.transparency.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="w-14 text-gray-500">説明責任</span>
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${clampPct(((p.accountability + 1) / 2) * 100)}%` }} />
                        </div>
                        <span className="w-8 text-right font-medium text-gray-700">{p.accountability.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="w-14 font-semibold text-gray-600">信頼度</span>
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500 rounded-full" style={{ width: `${clampPct(p.confidence * 100)}%` }} />
                        </div>
                        <span className="w-8 text-right font-bold text-gray-800">{(p.confidence * 100).toFixed(0)}%</span>
                      </div>
                    </>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <p className="text-center text-gray-400 py-10">該当するプロフェッショナルが見つかりません</p>
        )}
      </div>
    </main>
  );
}
