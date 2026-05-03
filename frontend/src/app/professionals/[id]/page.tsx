import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { GoogleLoginButton, SignOutButton } from "./LoginPromptClient";

// ---- 型定義 ----
interface ProfRow {
  id: number; name: string; profession_type: string;
  organization: string | null; stance_axis1: number;
  stance_axis2: number; confidence: number; record_count: number;
}
interface ConductRow {
  id: number; log_date: string; log_type: string | null;
  conduct_notes: string | null; outcome_notes: string | null;
}
interface DecisionRow {
  id: number; organization: string | null; decision_type: string | null;
  decision_date: string | null; title: string | null;
  summary: string | null; source_url: string | null;
}
interface CountRow { total: string; }

const COLORS: Record<string, string> = {
  裁判官: "#6366f1", 弁護士: "#10b981", 医師: "#f59e0b", 公務員: "#ef4444",
};
function profColor(t: string) {
  for (const [k, v] of Object.entries(COLORS)) if (t.includes(k)) return v;
  return "#6b7280";
}

function clampPct(value: number) {
  return Math.max(0, Math.min(100, value));
}

// ---- generateMetadata（SEO用） ----
export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
  const id = parseInt(params.id);
  if (isNaN(id)) return { title: "プロフェッショナル | Accountabilities" };
  const rows = await query<ProfRow>(
    "SELECT name, profession_type, organization FROM professionals WHERE id=$1", [id]
  );
  if (!rows.length) return { title: "プロフェッショナル | Accountabilities" };
  const r = rows[0];
  return {
    title: `${r.name}（${r.profession_type}）| Accountabilities`,
    description: `${r.name}の透明性・説明責任スコア、懲戒歴、関連判例。${r.organization ?? ""}`,
    openGraph: {
      title: `${r.name}（${r.profession_type}）| Accountabilities`,
      description: `${r.name}の説明責任データ`,
    },
  };
}

// ---- メインページ（サーバーコンポーネント） ----
export default async function ProfessionalDetailPage(
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);
  if (isNaN(id)) notFound();

  const session = await getServerSession(authOptions);
  const isAuthenticated = !!session?.user;

  // プロフェッショナル基本情報
  const profRows = await query<ProfRow>(
    "SELECT id,name,profession_type,organization,stance_axis1,stance_axis2,confidence,record_count FROM professionals WHERE id=$1",
    [id]
  );
  if (!profRows.length) notFound();
  const p = profRows[0];
  const color = profColor(p.profession_type);

  // 懲戒歴
  const conductCount = await query<CountRow>(
    "SELECT COUNT(*) AS total FROM conduct_logs WHERE professional_id=$1", [id]
  );
  const conductTotal = parseInt(conductCount[0]?.total ?? "0");
  let conductDetails: ConductRow[] = [];
  if (isAuthenticated && conductTotal > 0) {
    conductDetails = await query<ConductRow>(
      "SELECT id,log_date,log_type,conduct_notes,outcome_notes FROM conduct_logs WHERE professional_id=$1 ORDER BY log_date DESC",
      [id]
    );
  }

  // 判例
  const decisionsCount = await query<CountRow>(
    "SELECT COUNT(*) AS total FROM decisions d JOIN decision_professionals dp ON dp.decision_id=d.id WHERE dp.professional_id=$1",
    [id]
  );
  const decisionsTotal = parseInt(decisionsCount[0]?.total ?? "0");
  let decisionDetails: DecisionRow[] = [];
  if (isAuthenticated && decisionsTotal > 0) {
    decisionDetails = await query<DecisionRow>(
      `SELECT d.id,d.organization,d.decision_type,d.decision_date,d.title,d.summary,d.source_url
       FROM decisions d JOIN decision_professionals dp ON dp.decision_id=d.id
       WHERE dp.professional_id=$1 ORDER BY d.decision_date DESC NULLS LAST`,
      [id]
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
            ← マップに戻る
          </Link>
          {isAuthenticated ? <SignOutButton /> : <GoogleLoginButton />}
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* プロフィール */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
              style={{ backgroundColor: color }}
            >
              {p.name[0]}
            </div>
            <div className="flex-1">
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: color }}
              >
                {p.profession_type}
              </span>
              <h1 className="text-2xl font-bold text-gray-900 mt-1">{p.name}</h1>
              {p.organization && (
                <p className="text-sm text-gray-500 mt-1">{p.organization}</p>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {p.record_count.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">関連案件数</div>
              </div>
              <div className="col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: "透明性スコア", value: p.stance_axis1, color: "bg-[#185FA5]", pct: ((p.stance_axis1 + 1) / 2) * 100 },
                  { label: "説明責任スコア", value: p.stance_axis2, color: "bg-emerald-500", pct: ((p.stance_axis2 + 1) / 2) * 100 },
                  { label: "信頼度", value: p.confidence, color: "bg-purple-500", pct: p.confidence * 100 },
                ].map((s) => (
                  <div key={s.label} className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">{s.label}</div>
                    <div className="text-lg font-bold text-gray-900 mb-2">
                      {s.label === "信頼度" ? `${s.pct.toFixed(0)}%` : s.value.toFixed(2)}
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${s.color}`} style={{ width: `${clampPct(s.pct)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 懲戒歴 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            懲戒歴
            <span className="ml-2 text-sm font-normal text-gray-500">{conductTotal}件</span>
          </h2>
          {conductTotal === 0 ? (
            <p className="text-sm text-gray-400">記録なし</p>
          ) : !isAuthenticated ? (
            <div>
              <p className="text-sm text-gray-700 font-medium mb-3">{conductTotal}件</p>
              <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-4 text-center">
                <p className="text-sm text-indigo-700 mb-3">ログインすると詳細が表示されます</p>
                <GoogleLoginButton />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {conductDetails.map(c => (
                <div key={c.id} className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-red-600 text-sm">{c.log_type ?? "処分"}</span>
                    <span className="text-xs text-gray-400">{String(c.log_date).slice(0, 10)}</span>
                  </div>
                  {c.conduct_notes && <p className="text-sm text-gray-700">{c.conduct_notes}</p>}
                  {c.outcome_notes && <p className="text-sm text-gray-500 mt-1">{c.outcome_notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 判例 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            関連判例
            <span className="ml-2 text-sm font-normal text-gray-500">{decisionsTotal}件</span>
          </h2>
          {decisionsTotal === 0 ? (
            <p className="text-sm text-gray-400">記録なし</p>
          ) : !isAuthenticated ? (
            <div>
              <p className="text-sm text-gray-700 font-medium mb-3">{decisionsTotal}件</p>
              <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-4 text-center">
                <p className="text-sm text-indigo-700 mb-3">ログインすると詳細が表示されます</p>
                <GoogleLoginButton />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {decisionDetails.map(d => (
                <div key={d.id} className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-indigo-600 text-sm">
                      {d.organization ?? d.decision_type ?? "判例"}
                    </span>
                    <span className="text-xs text-gray-400">{d.decision_date ?? ""}</span>
                  </div>
                  {d.title && <p className="text-sm font-medium text-gray-800 mb-1">{d.title}</p>}
                  {d.summary && <p className="text-sm text-gray-600 line-clamp-4">{d.summary}</p>}
                  {d.source_url && (
                    <a
                      href={d.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-indigo-500 hover:underline mt-2 block"
                    >
                      判決文を見る →
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
