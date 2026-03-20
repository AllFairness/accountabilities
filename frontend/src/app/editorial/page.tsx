import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Open Justice Editorial | Accountabilities",
  description:
    "判決文品質評価スコアリングシステムの設計書・評価フレームワーク・設計プロセス・実装ロードマップ。Judicial Decision Quality Scoring System design documentation.",
};

type Section = {
  label: string;
  labelEn: string;
  desc: string;
  descEn: string;
  links: { text: string; href: string; badge?: string }[];
};

const sections: Section[] = [
  {
    label: "概要・設計書トップ",
    labelEn: "Overview",
    desc: "スコアリングシステム全体の設計思想と構造",
    descEn: "Overall design philosophy and structure of the scoring system",
    links: [
      { text: "設計書トップ（デスクトップ）", href: "/editorial/overview.html", badge: "JP · Desktop" },
      { text: "コンセプト概要", href: "/editorial/concept.html", badge: "JP" },
      { text: "Design Document (English)", href: "/editorial/en/overview.html", badge: "EN" },
    ],
  },
  {
    label: "評価フレームワーク",
    labelEn: "Evaluation Framework",
    desc: "三軸評価モデル（透明性・当事者応答性・正当化）の詳細仕様",
    descEn: "Three-axis evaluation model: Transparency, Responsiveness, Justification",
    links: [
      { text: "フレームワーク詳細 p.1（デスクトップ）", href: "/editorial/framework-1.html", badge: "JP · Desktop" },
      { text: "フレームワーク詳細 p.2（デスクトップ）", href: "/editorial/framework-2.html", badge: "JP · Desktop" },
      { text: "フレームワーク詳細（モバイル）", href: "/editorial/framework-mobile.html", badge: "JP · Mobile" },
    ],
  },
  {
    label: "設計プロセスの透明性",
    labelEn: "Design Process Transparency",
    desc: "AIと人間の対話ログ——設計根拠の外部公開",
    descEn: "AI-human dialogue log — public record of design rationale",
    links: [
      { text: "設計プロセス対話ログ（デスクトップ）", href: "/editorial/process.html", badge: "JP · Desktop" },
      { text: "設計プロセス対話ログ（モバイル）", href: "/editorial/process-mobile.html", badge: "JP · Mobile" },
      { text: "Design Process Dialogue Log (English)", href: "/editorial/en/process.html", badge: "EN" },
    ],
  },
  {
    label: "実装ロードマップ",
    labelEn: "Implementation Roadmap",
    desc: "フェーズ別実装計画と公開資料へのリンク",
    descEn: "Phase-by-phase implementation plan and public records",
    links: [
      { text: "実装ロードマップと公開資料", href: "/editorial/roadmap.html", badge: "JP" },
      { text: "Implementation Roadmap (English)", href: "/editorial/en/roadmap.html", badge: "EN" },
    ],
  },
  {
    label: "Webサイト公開ガイド",
    labelEn: "Web Publication Guide",
    desc: "多言語対応・Vercelデプロイ手順",
    descEn: "Multilingual support and Vercel deployment guide",
    links: [
      { text: "公開・操作ガイド", href: "/editorial/guide.html", badge: "JP" },
    ],
  },
];

const badgeColors: Record<string, string> = {
  "JP · Desktop": "#1a3a6b",
  "JP · Mobile": "#2d5a8e",
  JP: "#185FA5",
  EN: "#1e6b3a",
};

export default function EditorialPage() {
  return (
    <main style={{ fontFamily: "'Noto Sans JP', sans-serif", color: "#0f172a", background: "#fff", minHeight: "100vh" }}>
      {/* ナビ */}
      <nav style={{ borderBottom: "1px solid #e5e5e5", padding: "16px 24px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.12em", color: "#185FA5", textDecoration: "none" }}>
            ACCOUNTABILITIES.ORG
          </Link>
          <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
            <Link href="/map" style={{ fontSize: 13, color: "#555", textDecoration: "none" }}>データを見る</Link>
            <Link href="/professionals" style={{ fontSize: 13, color: "#555", textDecoration: "none" }}>一覧</Link>
            <Link href="/editorial" style={{ fontSize: 13, color: "#185FA5", fontWeight: 600, textDecoration: "none" }}>設計書</Link>
            <a
              href="/trials/new"
              style={{ fontSize: 13, fontWeight: 600, background: "#0f172a", color: "#fff", padding: "8px 18px", borderRadius: 8, textDecoration: "none" }}
            >
              訴訟記録を投稿する
            </a>
          </div>
        </div>
      </nav>

      {/* ヘッダー */}
      <section style={{ padding: "72px 24px 56px", background: "#f8fafc", borderBottom: "1px solid #e5e5e5" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", color: "#185FA5", marginBottom: 20, textTransform: "uppercase" }}>
            Open Justice Editorial
          </p>
          <h1 style={{ fontFamily: "'Noto Serif JP', serif", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 700, lineHeight: 1.4, marginBottom: 20, letterSpacing: "-0.01em" }}>
            判決文品質評価<br />
            スコアリングシステム 設計書
          </h1>
          <p style={{ fontSize: 15, color: "#555", lineHeight: 1.9, marginBottom: 0, maxWidth: 600 }}>
            Judicial Decision Quality Scoring System — Design Documentation<br />
            設計プロセスの透明性を担保するために、設計根拠・対話ログ・フレームワーク・ロードマップを外部公開する。
          </p>
        </div>
      </section>

      {/* セクション一覧 */}
      <section style={{ padding: "56px 24px 96px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", flexDirection: "column", gap: 40 }}>
          {sections.map((sec, i) => (
            <div
              key={i}
              style={{
                background: "#fff",
                borderRadius: 10,
                border: "1px solid #e8edf3",
                padding: "28px 32px",
                boxShadow: "0 2px 8px rgba(15,23,42,0.04)",
              }}
            >
              <div style={{ marginBottom: 16 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
                  {sec.label}
                  <span style={{ fontSize: 12, fontWeight: 400, color: "#888", marginLeft: 10 }}>{sec.labelEn}</span>
                </h2>
                <p style={{ fontSize: 13, color: "#666", lineHeight: 1.7, margin: 0 }}>
                  {sec.desc}<br />
                  <span style={{ color: "#999" }}>{sec.descEn}</span>
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {sec.links.map((link, j) => (
                  <a
                    key={j}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 14px",
                      background: "#f8fafc",
                      borderRadius: 6,
                      textDecoration: "none",
                      color: "#0f172a",
                      fontSize: 14,
                      fontWeight: 500,
                      transition: "background 0.15s",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        padding: "2px 7px",
                        borderRadius: 4,
                        background: badgeColors[link.badge ?? "JP"] ?? "#185FA5",
                        color: "#fff",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      {link.badge}
                    </span>
                    {link.text}
                    <span style={{ marginLeft: "auto", color: "#aaa", fontSize: 12 }}>→</span>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
