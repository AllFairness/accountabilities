"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

type Professional = {
  id: string;
  name: string;
  profession: string;
  transparency: number; // X軸: 透明性 (-1〜1)
  accountability: number; // Y軸: 説明責任 (-1〜1)
  color: string;
  cases: number;
};

const mockData: Professional[] = [
  {
    id: "1",
    name: "田中 裕介",
    profession: "裁判官",
    transparency: 0.3,
    accountability: 0.7,
    color: "#6366f1",
    cases: 142,
  },
  {
    id: "2",
    name: "佐藤 美穂",
    profession: "裁判官",
    transparency: -0.2,
    accountability: 0.4,
    color: "#6366f1",
    cases: 98,
  },
  {
    id: "3",
    name: "鈴木 一郎",
    profession: "裁判官",
    transparency: 0.6,
    accountability: -0.1,
    color: "#6366f1",
    cases: 203,
  },
  {
    id: "4",
    name: "山田 弁護士",
    profession: "弁護士",
    transparency: 0.8,
    accountability: 0.9,
    color: "#10b981",
    cases: 87,
  },
  {
    id: "5",
    name: "伊藤 法律事務所",
    profession: "弁護士",
    transparency: -0.5,
    accountability: -0.3,
    color: "#10b981",
    cases: 312,
  },
  {
    id: "6",
    name: "渡辺 誠司",
    profession: "弁護士",
    transparency: 0.4,
    accountability: 0.2,
    color: "#10b981",
    cases: 56,
  },
  {
    id: "7",
    name: "高橋 医師",
    profession: "医師",
    transparency: 0.1,
    accountability: 0.6,
    color: "#f59e0b",
    cases: 445,
  },
  {
    id: "8",
    name: "中村 外科",
    profession: "医師",
    transparency: -0.7,
    accountability: -0.5,
    color: "#f59e0b",
    cases: 178,
  },
  {
    id: "9",
    name: "小林 内科",
    profession: "医師",
    transparency: 0.5,
    accountability: 0.3,
    color: "#f59e0b",
    cases: 290,
  },
  {
    id: "10",
    name: "加藤 行政官",
    profession: "公務員",
    transparency: -0.4,
    accountability: 0.1,
    color: "#ef4444",
    cases: 33,
  },
  {
    id: "11",
    name: "松本 市職員",
    profession: "公務員",
    transparency: -0.8,
    accountability: -0.7,
    color: "#ef4444",
    cases: 21,
  },
  {
    id: "12",
    name: "井上 県庁",
    profession: "公務員",
    transparency: 0.2,
    accountability: -0.2,
    color: "#ef4444",
    cases: 67,
  },
];

const professions = [
  { name: "裁判官", color: "#6366f1" },
  { name: "弁護士", color: "#10b981" },
  { name: "医師", color: "#f59e0b" },
  { name: "公務員", color: "#ef4444" },
];

export default function HomePage() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selected, setSelected] = useState<Professional | null>(null);
  const [filter, setFilter] = useState<string | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

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

    const x = d3.scaleLinear().domain([-1, 1]).range([0, width]);
    const y = d3.scaleLinear().domain([-1, 1]).range([height, 0]);

    // 象限背景
    const quadrants = [
      { x: 0, y: 0, label: "高透明・高責任", bg: "#f0fdf4" },
      { x: -1, y: 0, label: "低透明・高責任", bg: "#fffbeb" },
      { x: 0, y: -1, label: "高透明・低責任", bg: "#eff6ff" },
      { x: -1, y: -1, label: "低透明・低責任", bg: "#fef2f2" },
    ];

    quadrants.forEach((q) => {
      svg
        .append("rect")
        .attr("x", x(q.x))
        .attr("y", y(Math.max(q.y, q.y === 0 ? 1 : 0)))
        .attr("width", width / 2)
        .attr("height", height / 2)
        .attr("fill", q.bg)
        .attr("opacity", 0.6);
    });

    // グリッド線
    svg
      .append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0,${height})`)
      .call(
        d3
          .axisBottom(x)
          .ticks(5)
          .tickSize(-height)
          .tickFormat(() => "")
      )
      .selectAll("line")
      .attr("stroke", "#e5e7eb")
      .attr("stroke-dasharray", "3,3");

    svg
      .append("g")
      .attr("class", "grid")
      .call(
        d3
          .axisLeft(y)
          .ticks(5)
          .tickSize(-width)
          .tickFormat(() => "")
      )
      .selectAll("line")
      .attr("stroke", "#e5e7eb")
      .attr("stroke-dasharray", "3,3");

    // 軸
    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5))
      .selectAll("text")
      .attr("fill", "#6b7280")
      .style("font-size", "11px");

    svg
      .append("g")
      .call(d3.axisLeft(y).ticks(5))
      .selectAll("text")
      .attr("fill", "#6b7280")
      .style("font-size", "11px");

    // 中心線
    svg
      .append("line")
      .attr("x1", x(0))
      .attr("x2", x(0))
      .attr("y1", 0)
      .attr("y2", height)
      .attr("stroke", "#9ca3af")
      .attr("stroke-width", 1.5);

    svg
      .append("line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", y(0))
      .attr("y2", y(0))
      .attr("stroke", "#9ca3af")
      .attr("stroke-width", 1.5);

    // 軸ラベル
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height + 50)
      .attr("text-anchor", "middle")
      .attr("fill", "#374151")
      .style("font-size", "13px")
      .style("font-weight", "600")
      .text("← 低い　透明性　高い →");

    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -48)
      .attr("text-anchor", "middle")
      .attr("fill", "#374151")
      .style("font-size", "13px")
      .style("font-weight", "600")
      .text("← 低い　説明責任　高い →");

    // データポイント
    const filtered = filter
      ? mockData.filter((d) => d.profession === filter)
      : mockData;

    const sizeScale = d3.scaleSqrt().domain([0, 500]).range([6, 20]);

    svg
      .selectAll("circle")
      .data(filtered)
      .enter()
      .append("circle")
      .attr("cx", (d) => x(d.transparency))
      .attr("cy", (d) => y(d.accountability))
      .attr("r", (d) => sizeScale(d.cases))
      .attr("fill", (d) => d.color)
      .attr("fill-opacity", 0.75)
      .attr("stroke", (d) =>
        selected?.id === d.id ? "#1f2937" : "white"
      )
      .attr("stroke-width", (d) => (selected?.id === d.id ? 3 : 1.5))
      .attr("cursor", "pointer")
      .on("click", (_event, d) => {
        setSelected((prev) => (prev?.id === d.id ? null : d));
      })
      .on("mouseover", function () {
        d3.select(this).attr("fill-opacity", 1);
      })
      .on("mouseout", function () {
        d3.select(this).attr("fill-opacity", 0.75);
      });

    // ラベル
    svg
      .selectAll("text.label")
      .data(filtered)
      .enter()
      .append("text")
      .attr("class", "label")
      .attr("x", (d) => x(d.transparency) + sizeScale(d.cases) + 4)
      .attr("y", (d) => y(d.accountability) + 4)
      .text((d) => d.name)
      .attr("fill", "#374151")
      .style("font-size", "10px")
      .style("pointer-events", "none");
  }, [filter, selected]);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">
            プロフェッショナル説明責任マップ
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            各職種の透明性・説明責任スコアの分布（モックデータ）
          </p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* メインチャート */}
          <div className="flex-1">
            {/* フィルター */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setFilter(null)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filter === null
                    ? "bg-gray-900 text-white"
                    : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                すべて
              </button>
              {professions.map((p) => (
                <button
                  key={p.name}
                  onClick={() => setFilter(filter === p.name ? null : p.name)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border`}
                  style={{
                    backgroundColor:
                      filter === p.name ? p.color : "white",
                    color: filter === p.name ? "white" : p.color,
                    borderColor: p.color,
                  }}
                >
                  {p.name}
                </button>
              ))}
            </div>

            {/* SVGチャート */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 overflow-x-auto">
              <svg ref={svgRef} />
            </div>

            {/* 凡例 */}
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
              {professions.map((p) => (
                <div key={p.name} className="flex items-center gap-1.5">
                  <span
                    className="w-3 h-3 rounded-full inline-block"
                    style={{ backgroundColor: p.color }}
                  />
                  {p.name}
                </div>
              ))}
              <div className="flex items-center gap-1.5">
                <span className="text-gray-400">○サイズ</span>= 案件数
              </div>
            </div>
          </div>

          {/* サイドパネル */}
          <div className="lg:w-72">
            {selected ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sticky top-6">
                <div className="flex items-center justify-between mb-4">
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                    style={{
                      backgroundColor: professions.find(
                        (p) => p.name === selected.profession
                      )?.color,
                    }}
                  >
                    {selected.profession}
                  </span>
                  <button
                    onClick={() => setSelected(null)}
                    className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                  >
                    ×
                  </button>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  {selected.name}
                </h2>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-xs text-gray-500 mb-1">透明性スコア</dt>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full">
                        <div
                          className="h-2 rounded-full bg-indigo-500"
                          style={{
                            width: `${((selected.transparency + 1) / 2) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-700 w-10 text-right">
                        {selected.transparency.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500 mb-1">説明責任スコア</dt>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full">
                        <div
                          className="h-2 rounded-full bg-emerald-500"
                          style={{
                            width: `${((selected.accountability + 1) / 2) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-700 w-10 text-right">
                        {selected.accountability.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-gray-100">
                    <dt className="text-xs text-gray-500">関連案件数</dt>
                    <dd className="text-2xl font-bold text-gray-900 mt-0.5">
                      {selected.cases.toLocaleString()}
                      <span className="text-sm font-normal text-gray-500 ml-1">件</span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500 mb-1">総合評価</dt>
                    <dd className="text-sm font-medium">
                      {selected.transparency > 0 && selected.accountability > 0 && (
                        <span className="text-emerald-600">高透明・高説明責任</span>
                      )}
                      {selected.transparency <= 0 && selected.accountability > 0 && (
                        <span className="text-amber-600">低透明・高説明責任</span>
                      )}
                      {selected.transparency > 0 && selected.accountability <= 0 && (
                        <span className="text-blue-600">高透明・低説明責任</span>
                      )}
                      {selected.transparency <= 0 && selected.accountability <= 0 && (
                        <span className="text-red-600">低透明・低説明責任</span>
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-700 mb-3">使い方</h3>
                <ul className="text-sm text-gray-500 space-y-2">
                  <li>• ドットをクリックして詳細を確認</li>
                  <li>• 上部ボタンで職種フィルター</li>
                  <li>• ドットの大きさ = 案件数</li>
                </ul>
                <div className="mt-5 pt-4 border-t border-gray-100">
                  <h3 className="font-semibold text-gray-700 mb-3">象限の意味</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-start gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-400 mt-1 shrink-0" />
                      <span className="text-gray-600">
                        <strong>右上:</strong> 高透明・高説明責任（理想）
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400 mt-1 shrink-0" />
                      <span className="text-gray-600">
                        <strong>左上:</strong> 低透明・高説明責任（要改善）
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-400 mt-1 shrink-0" />
                      <span className="text-gray-600">
                        <strong>右下:</strong> 高透明・低説明責任（部分的）
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-400 mt-1 shrink-0" />
                      <span className="text-gray-600">
                        <strong>左下:</strong> 低透明・低説明責任（問題）
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 統計サマリー */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mt-4">
              <h3 className="font-semibold text-gray-700 mb-3">統計サマリー</h3>
              <div className="space-y-2">
                {professions.map((p) => {
                  const items = mockData.filter(
                    (d) => d.profession === p.name
                  );
                  const avgT =
                    items.reduce((s, d) => s + d.transparency, 0) /
                    items.length;
                  const avgA =
                    items.reduce((s, d) => s + d.accountability, 0) /
                    items.length;
                  return (
                    <div key={p.name} className="text-xs">
                      <div className="flex items-center justify-between mb-0.5">
                        <span
                          className="font-medium"
                          style={{ color: p.color }}
                        >
                          {p.name}
                        </span>
                        <span className="text-gray-400">
                          T: {avgT.toFixed(2)} / A: {avgA.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
