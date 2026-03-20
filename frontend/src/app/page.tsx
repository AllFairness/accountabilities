import Link from "next/link";
import { query } from "@/lib/db";
import { PageTracker } from "./components/PageTracker";

interface CountRow { count: string; }

export const revalidate = 3600; // 1時間キャッシュ

export default async function LandingPage() {
  const [profRows, decRows] = await Promise.all([
    query<CountRow>("SELECT COUNT(*) AS count FROM professionals"),
    query<CountRow>("SELECT COUNT(*) AS count FROM decisions"),
  ]);
  const profCount = parseInt(profRows[0]?.count ?? "0").toLocaleString("ja-JP");
  const decCount = parseInt(decRows[0]?.count ?? "0").toLocaleString("ja-JP");

  return (
    <main style={{ fontFamily: "'Noto Sans JP', sans-serif", color: "#0f172a", background: "#fff" }}>
      <PageTracker path="/" />

      {/* ナビ */}
      <nav style={{ borderBottom: "1px solid #e5e5e5", padding: "16px 24px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.12em", color: "#185FA5" }}>ACCOUNTABILITIES.ORG</span>
          <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
            <Link href="/map" style={{ fontSize: 13, color: "#555", textDecoration: "none" }}>データを見る</Link>
            <Link href="/professionals" style={{ fontSize: 13, color: "#555", textDecoration: "none" }}>一覧</Link>
            <Link href="/editorial" style={{ fontSize: 13, color: "#555", textDecoration: "none" }}>設計書</Link>
            <a
              href="/trials/new"
              style={{ fontSize: 13, fontWeight: 600, background: "#0f172a", color: "#fff", padding: "8px 18px", borderRadius: 8, textDecoration: "none" }}
            >
              訴訟記録を投稿する
            </a>
          </div>
        </div>
      </nav>

      {/* 1. Hero */}
      <section style={{ padding: "96px 24px 80px", borderBottom: "1px solid #e5e5e5" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", color: "#185FA5", marginBottom: 24, textTransform: "uppercase" }}>
            Accountabilities.org
          </p>
          <h1
            style={{
              fontFamily: "'Noto Serif JP', serif",
              fontSize: "clamp(32px, 5vw, 52px)",
              fontWeight: 700,
              lineHeight: 1.4,
              marginBottom: 28,
              letterSpacing: "-0.01em",
            }}
          >
            あなたの裁判の記録が、<br />
            <span style={{ color: "#185FA5" }}>次の人を守る。</span>
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.85, color: "#444", marginBottom: 40, maxWidth: 560 }}>
            日本の裁判官・弁護士の判断を、公開データとして蓄積する。<br />
            判決後でも、訴訟中でも——すべての期日の記録が、法曹の説明責任を問う証拠になる。
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
            <a
              href="/trials/new"
              style={{ background: "#0f172a", color: "#fff", padding: "14px 28px", borderRadius: 10, fontWeight: 700, fontSize: 15, textDecoration: "none", display: "inline-block" }}
            >
              訴訟記録を投稿する
            </a>
            <Link
              href="/map"
              style={{ fontSize: 14, color: "#185FA5", textDecoration: "none", fontWeight: 500 }}
            >
              データを見る →
            </Link>
          </div>
        </div>
        <div style={{ maxWidth: 720, margin: "64px auto 0", textAlign: "right" }}>
          <p style={{ fontSize: 13, color: "#999", marginBottom: 4 }}>登録済みプロフェッショナル</p>
          <p style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 48, fontWeight: 700, color: "#0f172a", lineHeight: 1 }}>
            {profCount}
            <span style={{ fontSize: 16, fontWeight: 400, marginLeft: 6, color: "#666" }}>名</span>
          </p>
        </div>
      </section>

      {/* 2. Tension */}
      <section style={{ padding: "80px 24px", borderBottom: "1px solid #e5e5e5", background: "#fafafa" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64 }} className="lp-tension-grid">
          <div>
            <p
              style={{
                fontFamily: "'Noto Serif JP', serif",
                fontSize: "clamp(18px, 2.5vw, 26px)",
                lineHeight: 1.9,
                color: "#1a1a1a",
                fontWeight: 700,
              }}
            >
              日本では、裁判官の判断に外部から異議を申し立てる手段が極めて限られている。
            </p>
            <p
              style={{
                fontFamily: "'Noto Serif JP', serif",
                fontSize: "clamp(18px, 2.5vw, 26px)",
                lineHeight: 1.9,
                color: "#185FA5",
                fontWeight: 700,
                marginTop: 24,
              }}
            >
              あなたの経験は、データになる。
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {[
              {
                num: "99.9%",
                desc: "日本の刑事裁判有罪率。構造的な問題を示す数字。",
              },
              {
                num: "0件",
                desc: "裁判官の判断を市民が公開追跡できるデータベース（本サービス以前）。",
              },
              {
                num: `${decCount}件`,
                desc: "現在収録済みの判決データ数。あなたの記録でさらに精度が上がる。",
              },
            ].map((f) => (
              <div key={f.num} style={{ borderLeft: "3px solid #185FA5", paddingLeft: 20 }}>
                <p style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 32, fontWeight: 700, color: "#0f172a", lineHeight: 1 }}>{f.num}</p>
                <p style={{ fontSize: 13, color: "#555", marginTop: 8, lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. How it works */}
      <section style={{ padding: "80px 24px", borderBottom: "1px solid #e5e5e5" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 28, fontWeight: 700, marginBottom: 48, textAlign: "center" }}>
            どのように機能するか
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 40 }} className="lp-steps-grid">
            {[
              {
                num: "01",
                title: "記録を投稿する",
                body: "事件番号・裁判所・担当裁判官・弁護士。判決後はもちろん、訴訟中の方は期日ごとに記録を追加できます。準備書面・証拠・期日の様子をタイムライン形式で蓄積。",
              },
              {
                num: "02",
                title: "AIが判決を分析する",
                body: "裁判所の公開判決文をAIが自動収集・分析。透明性スコアと説明責任スコアを算出し、データベースに蓄積する。",
                link: { text: "スコアリング設計書を読む →", href: "/editorial/overview.html" },
              },
              {
                num: "03",
                title: "社会の目線になる",
                body: "蓄積されたデータは誰でも検索・閲覧可能。担当前に調べる。傾向を知る。記録が社会的な抑止力になる。",
              },
            ].map((s) => (
              <div key={s.num}>
                <p style={{ fontSize: 36, fontWeight: 700, color: "#e5e5e5", fontFamily: "'Noto Serif JP', serif", lineHeight: 1, marginBottom: 16 }}>{s.num}</p>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: "#555", lineHeight: 1.85 }}>{s.body}</p>
                {"link" in s && s.link && (
                  <a href={s.link.href} style={{ fontSize: 13, color: "#185FA5", textDecoration: "none", fontWeight: 500, display: "inline-block", marginTop: 10 }}>
                    {s.link.text}
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3.5 いま戦っている方へ */}
      <section style={{ padding: "80px 24px", borderBottom: "1px solid #e5e5e5", background: "#fafafa" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", color: "#888", marginBottom: 24, textTransform: "uppercase" }}>
            いま戦っている方へ
          </p>
          <h2 style={{ fontFamily: "'Noto Serif JP', serif", fontSize: "clamp(22px, 3vw, 32px)", fontWeight: 700, marginBottom: 48, lineHeight: 1.6 }}>
            期日のたびに、記録が積み重なる。
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }} className="lp-fighting-grid">
            {/* 左カラム：3つのポイント */}
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              {[
                {
                  title: "期日ごとに記録を追加",
                  body: "口頭弁論・証人尋問・和解勧試——すべての期日の様子を時系列で投稿できます。",
                },
                {
                  title: "相手方・裁判所の言動を残す",
                  body: "裁判官の発言・弁護士の対応を記録することで、後から振り返れる客観的なログになります。",
                },
                {
                  title: "結審・判決後も継続できる",
                  body: "訴訟が終わってからも記録を追記可能。控訴審への引き継ぎにも使えます。",
                },
              ].map((item) => (
                <div key={item.title} style={{ display: "flex", gap: 16 }}>
                  <div style={{ width: 4, flexShrink: 0, background: "#185FA5", borderRadius: 2, marginTop: 4 }} />
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{item.title}</p>
                    <p style={{ fontSize: 14, color: "#555", lineHeight: 1.8 }}>{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
            {/* 右カラム：強調ボックス */}
            <div style={{ border: "1px solid #e5e5e5", borderRadius: 16, background: "#f5f5f5", padding: "36px 32px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 32 }}>
              <p
                style={{
                  fontFamily: "'Noto Serif JP', serif",
                  fontSize: "clamp(18px, 2vw, 22px)",
                  lineHeight: 1.9,
                  color: "#1a1a1a",
                  fontWeight: 700,
                  margin: 0,
                }}
              >
                判決を待たなくていい。<br />今日の期日の記録から、始められる。
              </p>
              <a
                href="/trials/new"
                style={{
                  display: "inline-block",
                  background: "#0f172a",
                  color: "#fff",
                  padding: "14px 28px",
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: 15,
                  textDecoration: "none",
                  alignSelf: "flex-start",
                }}
              >
                今日の期日を記録する
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Data Preview */}
      <section style={{ padding: "80px 24px", borderBottom: "1px solid #e5e5e5", background: "#fafafa" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
            現在のデータマップ（{profCount}名）
          </h2>
          <p style={{ fontSize: 13, color: "#888", marginBottom: 40 }}>透明性 × 説明責任スコア分布</p>
          <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", border: "1px solid #e5e5e5", background: "#fff" }}>
            {/* 散布図ダミー */}
            <svg width="100%" viewBox="0 0 640 400" style={{ display: "block" }}>
              <rect width="320" height="200" fill="#f0fdf4" opacity="0.6" />
              <rect x="320" width="320" height="200" fill="#fffbeb" opacity="0.6" />
              <rect y="200" width="320" height="200" fill="#eff6ff" opacity="0.6" />
              <rect x="320" y="200" width="320" height="200" fill="#fef2f2" opacity="0.6" />
              <line x1="320" y1="0" x2="320" y2="400" stroke="#9ca3af" strokeWidth="1.5" />
              <line x1="0" y1="200" x2="640" y2="200" stroke="#9ca3af" strokeWidth="1.5" />
              {/* ダミードット */}
              {[
                [120,80,8,"#6366f1"],[180,140,10,"#6366f1"],[90,160,7,"#6366f1"],
                [400,100,9,"#10b981"],[460,160,11,"#10b981"],[380,220,7,"#10b981"],
                [200,280,8,"#f59e0b"],[260,320,6,"#f59e0b"],
                [500,300,9,"#ef4444"],[540,250,7,"#ef4444"],
              ].map(([cx,cy,r,fill],i) => (
                <circle key={i} cx={cx} cy={cy} r={r} fill={fill as string} fillOpacity={0.75} stroke="white" strokeWidth="1.5" />
              ))}
              <text x="320" y="395" textAnchor="middle" fill="#374151" fontSize="12" fontWeight="600">← 低い　透明性　高い →</text>
            </svg>
            {/* ブラーオーバーレイ */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backdropFilter: "blur(6px)",
                background: "rgba(255,255,255,0.5)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
              }}
            >
              <p style={{ fontSize: 15, color: "#374151", fontWeight: 500 }}>
                ログインするとスコアと詳細データを確認できます
              </p>
              <Link
                href="/map"
                style={{ background: "#0f172a", color: "#fff", padding: "10px 24px", borderRadius: 8, fontWeight: 600, fontSize: 14, textDecoration: "none" }}
              >
                データを見る →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Voice */}
      <section style={{ padding: "80px 24px", borderBottom: "1px solid #e5e5e5" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "#185FA5", marginBottom: 32, textTransform: "uppercase" }}>
            投稿者の声
          </p>
          <blockquote
            style={{
              fontFamily: "'Noto Serif JP', serif",
              fontSize: "clamp(18px, 2.5vw, 24px)",
              lineHeight: 1.9,
              color: "#1a1a1a",
              fontWeight: 400,
              margin: 0,
              borderLeft: "3px solid #185FA5",
              paddingLeft: 28,
            }}
          >
            「判決に納得できなかった。でも、どこにも言える場所がなかった。ここに記録を残すことが、自分にできる唯一の抵抗だった。」
          </blockquote>
          <p style={{ fontSize: 13, color: "#888", marginTop: 20, paddingLeft: 31 }}>
            — 民事訴訟経験者・40代・東京
          </p>
        </div>
      </section>

      {/* 6. Final CTA */}
      <section style={{ padding: "96px 24px", background: "#0f172a" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
          <h2
            style={{
              fontFamily: "'Noto Serif JP', serif",
              fontSize: "clamp(24px, 3.5vw, 36px)",
              fontWeight: 700,
              color: "#fff",
              lineHeight: 1.6,
              marginBottom: 20,
            }}
          >
            あなたの経験を、次の人のための地図にする。
          </h2>
          <p style={{ fontSize: 16, color: "#94a3b8", lineHeight: 1.85, marginBottom: 40 }}>
            登録は無料。記録の公開範囲は自分で選べる。<br />まず一件、投稿してみてください。
          </p>
          <a
            href="/trials/new"
            style={{
              display: "inline-block",
              background: "#fff",
              color: "#0f172a",
              padding: "16px 40px",
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 16,
              textDecoration: "none",
            }}
          >
            訴訟記録を投稿する
          </a>
          <p style={{ fontSize: 12, color: "#64748b", marginTop: 20 }}>
            個人情報は収集しません。Googleアカウントでログイン。
          </p>
        </div>
      </section>

      {/* レスポンシブ対応 */}
      <style>{`
        @media (max-width: 768px) {
          .lp-tension-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
          .lp-steps-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
          .lp-fighting-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
          nav > div { flex-wrap: wrap; gap: 12px; }
        }
      `}</style>
    </main>
  );
}
