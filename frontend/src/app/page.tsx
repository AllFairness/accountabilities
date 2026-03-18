"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import AuthButton from "./components/AuthButton";
import * as d3 from "d3";
type Professional = { id: string; name: string; profession: string; organization: string; transparency: number; accountability: number; confidence: number; color: string; cases: number; };
const professions = [{ name: "裁判官", color: "#6366f1" }, { name: "弁護士", color: "#10b981" }, { name: "医師", color: "#f59e0b" }, { name: "公務員", color: "#ef4444" }];
export default function HomePage() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selected, setSelected] = useState<Professional | null>(null);
  const [filter, setFilter] = useState<string | null>(null);
  const [data, setData] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const fetchProfessionals = useCallback(async (pt?: string | null) => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams({ limit: "200" });
      if (pt) params.set("profession_type", pt);
      const res = await fetch(`/api/professionals?${params}`);
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `HTTP ${res.status}`);
      const json = await res.json();
      setData(json.data ?? []); setTotal(json.total ?? 0);
    } catch (e) { setError(e instanceof Error ? e.message : "取得失敗"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchProfessionals(filter); }, [filter, fetchProfessionals]);
  useEffect(() => {
    if (!svgRef.current || loading || data.length === 0) return;
    const margin = { top: 40, right: 40, bottom: 60, left: 60 };
    const width = 640 - margin.left - margin.right, height = 520 - margin.top - margin.bottom;
    d3.select(svgRef.current).selectAll("*").remove();
    const svg = d3.select(svgRef.current).attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom).append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    const x = d3.scaleLinear().domain([-1, 1]).range([0, width]);
    const y = d3.scaleLinear().domain([-1, 1]).range([height, 0]);
    [{ x: 0, y: 0, bg: "#f0fdf4" }, { x: -1, y: 0, bg: "#fffbeb" }, { x: 0, y: -1, bg: "#eff6ff" }, { x: -1, y: -1, bg: "#fef2f2" }].forEach(q => {
      svg.append("rect").attr("x", x(q.x)).attr("y", y(q.y === 0 ? 1 : 0)).attr("width", width / 2).attr("height", height / 2).attr("fill", q.bg).attr("opacity", 0.6);
    });
    svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x).ticks(5).tickSize(-height).tickFormat(() => "")).selectAll("line").attr("stroke", "#e5e7eb").attr("stroke-dasharray", "3,3");
    svg.append("g").call(d3.axisLeft(y).ticks(5).tickSize(-width).tickFormat(() => "")).selectAll("line").attr("stroke", "#e5e7eb").attr("stroke-dasharray", "3,3");
    svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x).ticks(5)).selectAll("text").attr("fill", "#6b7280").style("font-size", "11px");
    svg.append("g").call(d3.axisLeft(y).ticks(5)).selectAll("text").attr("fill", "#6b7280").style("font-size", "11px");
    svg.append("line").attr("x1", x(0)).attr("x2", x(0)).attr("y1", 0).attr("y2", height).attr("stroke", "#9ca3af").attr("stroke-width", 1.5);
    svg.append("line").attr("x1", 0).attr("x2", width).attr("y1", y(0)).attr("y2", y(0)).attr("stroke", "#9ca3af").attr("stroke-width", 1.5);
    svg.append("text").attr("x", width / 2).attr("y", height + 50).attr("text-anchor", "middle").attr("fill", "#374151").style("font-size", "13px").style("font-weight", "600").text("← 低い　透明性　高い →");
    svg.append("text").attr("transform", "rotate(-90)").attr("x", -height / 2).attr("y", -48).attr("text-anchor", "middle").attr("fill", "#374151").style("font-size", "13px").style("font-weight", "600").text("← 低い　説明責任　高い →");
    const sizeScale = d3.scaleSqrt().domain([0, d3.max(data, d => d.cases) ?? 500]).range([6, 20]);
    svg.selectAll("circle").data(data).enter().append("circle").attr("cx", d => x(d.transparency)).attr("cy", d => y(d.accountability)).attr("r", d => sizeScale(d.cases)).attr("fill", d => d.color).attr("fill-opacity", 0.75).attr("stroke", d => selected?.id === d.id ? "#1f2937" : "white").attr("stroke-width", d => selected?.id === d.id ? 3 : 1.5).attr("cursor", "pointer").on("click", (_e, d) => setSelected(prev => prev?.id === d.id ? null : d)).on("mouseover", function () { d3.select(this).attr("fill-opacity", 1); }).on("mouseout", function () { d3.select(this).attr("fill-opacity", 0.75); });
    if (data.length <= 30) svg.selectAll("text.label").data(data).enter().append("text").attr("class", "label").attr("x", d => x(d.transparency) + sizeScale(d.cases) + 4).attr("y", d => y(d.accountability) + 4).text(d => d.name).attr("fill", "#374151").style("font-size", "10px").style("pointer-events", "none");
  }, [data, selected, loading]);
  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">プロフェッショナル説明責任マップ</h1>
            <p className="text-sm text-gray-500 mt-1">各職種の透明性・説明責任スコアの分布{!loading && <span className="ml-2 text-indigo-600 font-medium">{total.toLocaleString()} 件</span>}</p>
          </div>
          <div className="flex items-center gap-3">
            <a href="/trials/new" className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors">訴訟記録を投稿する</a>
            <button onClick={() => fetchProfessionals(filter)} disabled={loading} className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-40">更新</button>
            <AuthButton />
          </div>
        </div>
      </header>
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            <div className="flex flex-wrap gap-2 mb-4">
              <button onClick={() => setFilter(null)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === null ? "bg-gray-900 text-white" : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"}`}>すべて</button>
              {professions.map(p => <button key={p.name} onClick={() => setFilter(filter === p.name ? null : p.name)} className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors border" style={{ backgroundColor: filter === p.name ? p.color : "white", color: filter === p.name ? "white" : p.color, borderColor: p.color }}>{p.name}</button>)}
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 overflow-x-auto relative min-h-[540px] flex items-center justify-center">
              {loading && <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 rounded-xl z-10"><div className="flex flex-col items-center gap-3"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /><span className="text-sm text-gray-500">データ読み込み中...</span></div></div>}
              {error && <div className="text-center"><p className="text-red-500 text-sm mb-2">{error}</p><button onClick={() => fetchProfessionals(filter)} className="text-sm text-indigo-600 hover:underline">再試行</button></div>}
              {!loading && !error && data.length === 0 && <p className="text-gray-400 text-sm">データがありません</p>}
              <svg ref={svgRef} className={loading || error ? "opacity-0" : ""} />
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
              {professions.map(p => <div key={p.name} className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: p.color }} />{p.name}</div>)}
              <div className="flex items-center gap-1.5"><span className="text-gray-400">○サイズ</span>= 案件数</div>
            </div>
          </div>
          <div className="lg:w-72">
            {selected ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sticky top-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: professions.find(p => p.name === selected.profession)?.color ?? "#6b7280" }}>{selected.profession}</span>
                  <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">{selected.name}</h2>
                {selected.organization && <p className="text-xs text-gray-500 mb-4">{selected.organization}</p>}
                <dl className="space-y-3">
                  {[{ label: "透明性スコア", value: selected.transparency, color: "bg-indigo-500", fmt: (v: number) => v.toFixed(2), pct: (v: number) => ((v + 1) / 2) * 100 }, { label: "説明責任スコア", value: selected.accountability, color: "bg-emerald-500", fmt: (v: number) => v.toFixed(2), pct: (v: number) => ((v + 1) / 2) * 100 }, { label: "信頼度", value: selected.confidence, color: "bg-purple-500", fmt: (v: number) => `${(v * 100).toFixed(0)}%`, pct: (v: number) => v * 100 }].map(({ label, value, color, fmt, pct }) => (
                    <div key={label}><dt className="text-xs text-gray-500 mb-1">{label}</dt><div className="flex items-center gap-2"><div className="flex-1 h-2 bg-gray-100 rounded-full"><div className={`h-2 rounded-full ${color}`} style={{ width: `${pct(value)}%` }} /></div><span className="text-sm font-semibold text-gray-700 w-12 text-right">{fmt(value)}</span></div></div>
                  ))}
                  <div className="pt-2 border-t border-gray-100"><dt className="text-xs text-gray-500">関連案件数</dt><dd className="text-2xl font-bold text-gray-900 mt-0.5">{selected.cases.toLocaleString()}<span className="text-sm font-normal text-gray-500 ml-1">件</span></dd></div>
                </dl>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-700 mb-3">使い方</h3>
                <ul className="text-sm text-gray-500 space-y-2"><li>• ドットをクリックして詳細を確認</li><li>• 上部ボタンで職種フィルター</li><li>• ドットの大きさ = 案件数</li></ul>
              </div>
            )}
            {!loading && data.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mt-4">
                <h3 className="font-semibold text-gray-700 mb-3">統計サマリー</h3>
                <div className="space-y-2">
                  {professions.map(p => { const items = data.filter(d => d.profession === p.name); if (!items.length) return null; const avgT = items.reduce((s, d) => s + d.transparency, 0) / items.length; const avgA = items.reduce((s, d) => s + d.accountability, 0) / items.length; return <div key={p.name} className="text-xs"><div className="flex items-center justify-between"><span className="font-medium" style={{ color: p.color }}>{p.name} ({items.length})</span><span className="text-gray-400">T:{avgT.toFixed(2)} A:{avgA.toFixed(2)}</span></div></div>; })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
