"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import * as d3 from "d3";

type Professional = {
  id: string;
  name: string;
  profession: string;
  organization: string;
  transparency: number | null;
  accountability: number | null;
  x: number;
  y: number;
  confidence: number | null;
  color: string;
  cases: number;
};

const professions = [
  { name: "裁判官", color: "#6366f1" },
  { name: "弁護士", color: "#10b981" },
  { name: "医師", color: "#f59e0b" },
  { name: "公務員", color: "#ef4444" },
];

function LoginPrompt() {
  return (
    <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-center">
      <p className="text-sm text-indigo-700 mb-3">
        ログインすると詳細が表示されます
      </p>
      <button
        onClick={() => signIn("google")}
        className="inline-flex items-center gap-2 rounded-lg bg-white border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Googleでログイン
      </button>
    </div>
  );
}

export default function HomePage() {
  const svgRef = useRef<SVGSVGElement>(null);
  const { data: session, status } = useSession();
  const isAuthenticated = !!session?.user;
  const [selected, setSelected] = useState<Professional | null>(null);
  const [filter, setFilter] = useState<string | null>(null);
  const [data, setData] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchProfessionals = useCallback(async (pt?: string | null) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "200" });
      if (pt) params.set("profession_type", pt);
      const res = await fetch(`/api/professionals?${params}`);
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `HTTP ${res.status}`);
      const json = await res.json();
      setData(json.data ?? []);
      setTotal(json.total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "取得失敗");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfessionals(filter); }, [filter, fetchProfessionals]);

  // 認証状態が変わったらデータ再取得
  useEffect(() => {
    if (status !== "loading") fetchProfessionals(filter);
  }, [status, isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!svgRef.current || loading || data.length === 0) return;
    const margin = { top: 40, right: 40, bottom: 60, left: 60 };
    const width = 640 - margin.left - margin.right;
    const height = 520 - margin.top - margin.bottom;
    d3.select(svgRef.current).selectAll("*").remove();
    const svg = d3
      .select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLinear().domain([-1, 1]).range([0, width]);
    const yScale = d3.scaleLinear().domain([-1, 1]).range([height, 0]);

    [{ x: 0, y: 0, bg: "#f0fdf4" }, { x: -1, y: 0, bg: "#fffbeb" }, { x: 0, y: -1, bg: "#eff6ff" }, { x: -1, y: -1, bg: "#fef2f2" }].forEach(q => {
      svg.append("rect").attr("x", xScale(q.x)).attr("y", yScale(q.y === 0 ? 1 : 0)).attr("width", width / 2).attr("height", height / 2).attr("fill", q.bg).attr("opacity", 0.6);
    });

    svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(xScale).ticks(5).tickSize(-height).tickFormat(() => "")).selectAll("line").attr("stroke", "#e5e7eb").attr("stroke-dasharray", "3,3");
    svg.append("g").call(d3.axisLeft(yScale).ticks(5).tickSize(-width).tickFormat(() => "")).selectAll("line").attr("stroke", "#e5e7eb").attr("stroke-dasharray", "3,3");
    svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(xScale).ticks(5)).selectAll("text").attr("fill", "#6b7280").style("font-size", "11px");
    svg.append("g").call(d3.axisLeft(yScale).ticks(5)).selectAll("text").attr("fill", "#6b7280").style("font-size", "11px");
    svg.append("line").attr("x1", xScale(0)).attr("x2", xScale(0)).attr("y1", 0).attr("y2", height).attr("stroke", "#9ca3af").attr("stroke-width", 1.5);
    svg.append("line").attr("x1", 0).attr("x2", width).attr("y1", yScale(0)).attr("y2", yScale(0)).attr("stroke", "#9ca3af").attr("stroke-width", 1.5);
    svg.append("text").attr("x", width / 2).attr("y", height + 50).attr("text-anchor", "middle").attr("fill", "#374151").style("font-size", "13px").style("font-weight", "600").text("← 低い　透明性　高い →");
    svg.append("text").attr("transform", "rotate(-90)").attr("x", -height / 2).attr("y", -48).attr("text-anchor", "middle").attr("fill", "#374151").style("font-size", "13px").style("font-weight", "600").text("← 低い　説明責任　高い →");

    const sizeScale = d3.scaleSqrt().domain([0, d3.max(data, d => d.cases) ?? 500]).range([6, 20]);

    svg.selectAll("circle")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", d => xScale(d.x))
      .attr("cy", d => yScale(d.y))
      .attr("r", d => sizeScale(d.cases))
      .attr("fill", d => d.color)
      .attr("fill-opacity", 0.75)
      .attr("stroke", d => selected?.id === d.id ? "#1f2937" : "white")
      .attr("stroke-width", d => selected?.id === d.id ? 3 : 1.5)
      .attr("cursor", "pointer")
      .on("click", (_e, d) => setSelected(prev => prev?.id === d.id ? null : d))
      .on("mouseover", function () { d3.select(this).attr("fill-opacity", 1); })
      .on("mouseout", function () { d3.select(this).attr("fill-opacity", 0.75); });

    if (data.length <= 30) {
      svg.selectAll("text.label")
        .data(data)
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("x", d => xScale(d.x) + sizeScale(d.cases) + 4)
        .attr("y", d => yScale(d.y) + 4)
        .text(d => d.name)
        .attr("fill", "#374151")
        .style("font-size", "10px")
        .style("pointer-events", "none");
    }
  }, [data, selected, loading]);

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">プロフェッショナル説明責任マップ</h1>
            <p className="text-sm text-gray-500 mt-1">
              各職種の透明性・説明責任スコアの分布
              {!loading && <span className="ml-2 text-indigo-600 font-medium">{total.toLocaleString()} 件</span>}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {status === "loading" ? null : isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">{session.user?.name ?? session.user?.email}</span>
                <button
                  onClick={() => signOut()}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  ログアウト
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn("google")}
                className="inline-flex items-center gap-2 rounded-lg bg-white border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                ログイン
              </button>
            )}
            <button
              onClick={() => fetchProfessionals(filter)}
              disabled={loading}
              className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-40"
            >
              更新
            </button>
          </div>
          <a href="/trials/new" className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors">訴訟記録を投稿する</a>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 overflow-x-auto relative min-h-[540px] flex items-center justify-center">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 rounded-xl z-10">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-gray-500">データ読み込み中...</span>
                  </div>
                </div>
              )}
              {error && (
                <div className="text-center">
                  <p className="text-red-500 text-sm mb-2">{error}</p>
                  <button onClick={() => fetchProfessionals(filter)} className="text-sm text-indigo-600 hover:underline">再試行</button>
                </div>
              )}
              {!loading && !error && data.length === 0 && <p className="text-gray-400 text-sm">データがありません</p>}
              <svg ref={svgRef} className={loading || error ? "opacity-0" : ""} />
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
              {professions.map(p => (
                <div key={p.name} className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: p.color }} />
                  {p.name}
                </div>
              ))}
              <div className="flex items-center gap-1.5"><span className="text-gray-400">○サイズ</span>= 案件数</div>
            </div>
          </div>

          <div className="lg:w-72">
            {selected ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sticky top-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: professions.find(p => p.name === selected.profession)?.color ?? "#6b7280" }}>
                    {selected.profession}
                  </span>
                  <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">{selected.name}</h2>
                {selected.organization && <p className="text-xs text-gray-500 mb-4">{selected.organization}</p>}

                {isAuthenticated ? (
                  <dl className="space-y-3">
                    {[
                      { label: "透明性スコア", value: selected.transparency, color: "bg-indigo-500", fmt: (v: number) => v.toFixed(2), pct: (v: number) => ((v + 1) / 2) * 100 },
                      { label: "説明責任スコア", value: selected.accountability, color: "bg-emerald-500", fmt: (v: number) => v.toFixed(2), pct: (v: number) => ((v + 1) / 2) * 100 },
                      { label: "信頼度", value: selected.confidence, color: "bg-purple-500", fmt: (v: number) => `${(v * 100).toFixed(0)}%`, pct: (v: number) => v * 100 },
                    ].map(({ label, value, color, fmt, pct }) => (
                      value !== null && (
                        <div key={label}>
                          <dt className="text-xs text-gray-500 mb-1">{label}</dt>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-100 rounded-full">
                              <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct(value)}%` }} />
                            </div>
                            <span className="text-sm font-semibold text-gray-700 w-12 text-right">{fmt(value)}</span>
                          </div>
                        </div>
                      )
                    ))}
                    <div className="pt-2 border-t border-gray-100">
                      <dt className="text-xs text-gray-500">関連案件数</dt>
                      <dd className="text-2xl font-bold text-gray-900 mt-0.5">
                        {selected.cases.toLocaleString()}
                        <span className="text-sm font-normal text-gray-500 ml-1">件</span>
                      </dd>
                    </div>
                  </dl>
                ) : (
                  <div>
                    <div className="pt-2 border-t border-gray-100 mb-3">
                      <dt className="text-xs text-gray-500">関連案件数</dt>
                      <dd className="text-2xl font-bold text-gray-900 mt-0.5">
                        {selected.cases.toLocaleString()}
                        <span className="text-sm font-normal text-gray-500 ml-1">件</span>
                      </dd>
                    </div>
                    <LoginPrompt />
                  </div>
                )}

                <ProfessionalDetails professionalId={selected.id} isAuthenticated={isAuthenticated} />
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-700 mb-3">使い方</h3>
                <ul className="text-sm text-gray-500 space-y-2">
                  <li>• ドットをクリックして詳細を確認</li>
                  <li>• 上部ボタンで職種フィルター</li>
                  <li>• ドットの大きさ = 案件数</li>
                </ul>
              </div>
            )}

            {!loading && data.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mt-4">
                <h3 className="font-semibold text-gray-700 mb-3">統計サマリー</h3>
                <div className="space-y-2">
                  {professions.map(p => {
                    const items = data.filter(d => d.profession === p.name);
                    if (!items.length) return null;
                    const avgX = items.reduce((s, d) => s + d.x, 0) / items.length;
                    const avgY = items.reduce((s, d) => s + d.y, 0) / items.length;
                    return (
                      <div key={p.name} className="text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-medium" style={{ color: p.color }}>{p.name} ({items.length})</span>
                          {isAuthenticated
                            ? <span className="text-gray-400">T:{avgX.toFixed(2)} A:{avgY.toFixed(2)}</span>
                            : <span className="text-gray-400 text-xs">ログイン後表示</span>
                          }
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function ProfessionalDetails({ professionalId, isAuthenticated }: { professionalId: string; isAuthenticated: boolean }) {
  const [conduct, setConduct] = useState<{ total: number; details: ConductDetail[] | null } | null>(null);
  const [decisions, setDecisions] = useState<{ total: number; details: DecisionDetail[] | null } | null>(null);

  useEffect(() => {
    fetch(`/api/professionals/${professionalId}/conduct`).then(r => r.json()).then(setConduct).catch(() => {});
    fetch(`/api/professionals/${professionalId}/decisions`).then(r => r.json()).then(setDecisions).catch(() => {});
  }, [professionalId, isAuthenticated]);

  return (
    <div className="mt-4 space-y-3">
      {/* 懲戒歴 */}
      <section>
        <h3 className="text-xs font-semibold text-gray-600 mb-1">懲戒歴</h3>
        {conduct === null ? (
          <p className="text-xs text-gray-400">読み込み中...</p>
        ) : conduct.total === 0 ? (
          <p className="text-xs text-gray-400">記録なし</p>
        ) : !isAuthenticated ? (
          <div>
            <p className="text-xs text-gray-700 font-medium">{conduct.total}件</p>
            <div className="mt-2 rounded-lg border border-indigo-100 bg-indigo-50 p-3 text-center">
              <p className="text-xs text-indigo-700 mb-2">ログインすると詳細が表示されます</p>
              <button
                onClick={() => signIn("google")}
                className="inline-flex items-center gap-1 rounded bg-white border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Googleでログイン
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {conduct.details?.map(c => (
              <div key={c.id} className="text-xs border border-gray-100 rounded p-2 bg-gray-50">
                <div className="flex justify-between items-start">
                  <span className="font-medium text-red-600">{c.log_type ?? "処分"}</span>
                  <span className="text-gray-400">{c.log_date}</span>
                </div>
                {c.conduct_notes && <p className="text-gray-600 mt-1">{c.conduct_notes}</p>}
                {c.outcome_notes && <p className="text-gray-500 mt-0.5">{c.outcome_notes}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 判例 */}
      <section>
        <h3 className="text-xs font-semibold text-gray-600 mb-1">判例</h3>
        {decisions === null ? (
          <p className="text-xs text-gray-400">読み込み中...</p>
        ) : decisions.total === 0 ? (
          <p className="text-xs text-gray-400">記録なし</p>
        ) : !isAuthenticated ? (
          <div>
            <p className="text-xs text-gray-700 font-medium">{decisions.total}件</p>
            <div className="mt-2 rounded-lg border border-indigo-100 bg-indigo-50 p-3 text-center">
              <p className="text-xs text-indigo-700 mb-2">ログインすると詳細が表示されます</p>
              <button
                onClick={() => signIn("google")}
                className="inline-flex items-center gap-1 rounded bg-white border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Googleでログイン
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {decisions.details?.map(d => (
              <div key={d.id} className="text-xs border border-gray-100 rounded p-2 bg-gray-50">
                <div className="flex justify-between items-start">
                  <span className="font-medium text-indigo-600">{d.organization ?? d.decision_type ?? "判例"}</span>
                  <span className="text-gray-400">{d.decision_date ?? ""}</span>
                </div>
                {d.title && <p className="text-gray-700 mt-1 font-medium">{d.title}</p>}
                {d.summary && <p className="text-gray-500 mt-0.5 line-clamp-3">{d.summary}</p>}
                {d.source_url && (
                  <a href={d.source_url} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline mt-1 block">
                    判決文を見る →
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

type ConductDetail = {
  id: number;
  log_date: string;
  organization: string | null;
  case_number: string | null;
  log_type: string | null;
  conduct_notes: string | null;
  outcome_notes: string | null;
};

type DecisionDetail = {
  id: number;
  decision_id: string;
  decision_type: string | null;
  organization: string | null;
  decision_date: string | null;
  case_number: string | null;
  title: string | null;
  summary: string | null;
  source_url: string | null;
};
