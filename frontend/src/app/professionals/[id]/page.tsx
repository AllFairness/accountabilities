"use client";
import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";

type Professional = {
  id: string;
  name: string;
  profession: string;
  organization: string;
  color: string;
  cases: number;
  transparency: number | null;
  accountability: number | null;
  confidence: number | null;
};

type ConductDetail = {
  id: number;
  log_date: string;
  log_type: string | null;
  conduct_notes: string | null;
  outcome_notes: string | null;
};

type DecisionDetail = {
  id: number;
  organization: string | null;
  decision_type: string | null;
  decision_date: string | null;
  title: string | null;
  summary: string | null;
  source_url: string | null;
};

function GoogleLoginButton({ small = false }: { small?: boolean }) {
  return (
    <button
      onClick={() => signIn("google")}
      className={`inline-flex items-center gap-2 rounded-lg bg-white border border-gray-300 font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors ${small ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"}`}
    >
      <svg className={small ? "w-3 h-3" : "w-4 h-4"} viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
      Googleでログイン
    </button>
  );
}

export default function ProfessionalDetailPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const isAuthenticated = !!session?.user;
  const [prof, setProf] = useState<Professional | null>(null);
  const [conduct, setConduct] = useState<{ total: number; details: ConductDetail[] | null } | null>(null);
  const [decisions, setDecisions] = useState<{ total: number; details: DecisionDetail[] | null } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    setLoading(true);
    Promise.all([
      fetch(`/api/professionals/${params.id}`).then(r => r.json()),
      fetch(`/api/professionals/${params.id}/conduct`).then(r => r.json()),
      fetch(`/api/professionals/${params.id}/decisions`).then(r => r.json()),
    ]).then(([profData, conductData, decisionsData]) => {
      setProf(profData.data ?? null);
      setConduct(conductData);
      setDecisions(decisionsData);
    }).finally(() => setLoading(false));
  }, [params.id, status, isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!prof) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">プロフェッショナルが見つかりません</p>
          <Link href="/" className="text-indigo-600 hover:underline">← トップに戻る</Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
            ← マップに戻る
          </Link>
          {!isAuthenticated && status !== "loading" && (
            <GoogleLoginButton />
          )}
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* プロフィール */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: prof.color }}>
              {prof.name[0]}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: prof.color }}>
                  {prof.profession}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{prof.name}</h1>
              {prof.organization && <p className="text-sm text-gray-500 mt-1">{prof.organization}</p>}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{prof.cases.toLocaleString()}</div>
                <div className="text-xs text-gray-500 mt-0.5">関連案件数</div>
              </div>
              {isAuthenticated ? (
                <>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600">
                      {prof.transparency !== null ? prof.transparency.toFixed(2) : "—"}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">透明性スコア</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-600">
                      {prof.accountability !== null ? prof.accountability.toFixed(2) : "—"}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">説明責任スコア</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {prof.confidence !== null ? `${(prof.confidence * 100).toFixed(0)}%` : "—"}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">信頼度</div>
                  </div>
                </>
              ) : (
                <div className="col-span-3">
                  <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-4 flex items-center justify-between">
                    <p className="text-sm text-indigo-700">ログインするとスコア詳細が表示されます</p>
                    <GoogleLoginButton small />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 懲戒歴 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            懲戒歴
            {conduct !== null && <span className="ml-2 text-sm font-normal text-gray-500">{conduct.total}件</span>}
          </h2>
          {conduct === null ? (
            <p className="text-sm text-gray-400">読み込み中...</p>
          ) : conduct.total === 0 ? (
            <p className="text-sm text-gray-400">記録なし</p>
          ) : !isAuthenticated ? (
            <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-4 text-center">
              <p className="text-sm text-indigo-700 mb-3">ログインすると詳細が表示されます</p>
              <GoogleLoginButton />
            </div>
          ) : (
            <div className="space-y-3">
              {conduct.details?.map(c => (
                <div key={c.id} className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-red-600 text-sm">{c.log_type ?? "処分"}</span>
                    <span className="text-xs text-gray-400">{c.log_date}</span>
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
            {decisions !== null && <span className="ml-2 text-sm font-normal text-gray-500">{decisions.total}件</span>}
          </h2>
          {decisions === null ? (
            <p className="text-sm text-gray-400">読み込み中...</p>
          ) : decisions.total === 0 ? (
            <p className="text-sm text-gray-400">記録なし</p>
          ) : !isAuthenticated ? (
            <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-4 text-center">
              <p className="text-sm text-indigo-700 mb-3">ログインすると詳細が表示されます</p>
              <GoogleLoginButton />
            </div>
          ) : (
            <div className="space-y-3">
              {decisions.details?.map(d => (
                <div key={d.id} className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-indigo-600 text-sm">{d.organization ?? d.decision_type ?? "判例"}</span>
                    <span className="text-xs text-gray-400">{d.decision_date ?? ""}</span>
                  </div>
                  {d.title && <p className="text-sm font-medium text-gray-800 mb-1">{d.title}</p>}
                  {d.summary && <p className="text-sm text-gray-600 line-clamp-4">{d.summary}</p>}
                  {d.source_url && (
                    <a href={d.source_url} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-500 hover:underline mt-2 block">
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
