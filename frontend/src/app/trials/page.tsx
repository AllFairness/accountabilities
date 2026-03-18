"use client";
import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

type Trial = {
  id: number;
  court_name: string;
  case_number: string | null;
  case_type: string;
  case_status: string;
  hearing_count: string;
  updated_at: string;
};

export default function TrialsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [trials, setTrials] = useState<Trial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") { signIn(); return; }
    if (status !== "authenticated") return;
    fetch("/api/trials")
      .then(res => res.json())
      .then(data => { setTrials(data.data ?? []); })
      .catch(() => setError("取得に失敗しました"))
      .finally(() => setLoading(false));
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!session) return null;

  const statusColor = (s: string) => {
    if (s === "判決") return "bg-red-100 text-red-700";
    if (s === "和解") return "bg-green-100 text-green-700";
    return "bg-blue-100 text-blue-700";
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">マイページ</h1>
            <p className="text-sm text-gray-500 mt-0.5">{session.user?.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" className="text-sm text-gray-500 hover:text-gray-700">← トップ</a>
            <a href="/trials/new" className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors">+ 新しい事件を登録</a>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <h2 className="text-base font-semibold text-gray-700 mb-4">登録済みの事件（{trials.length}件）</h2>

        {error && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 mb-4">{error}</div>}

        {trials.length === 0 && !error && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-gray-400 text-sm mb-4">まだ事件が登録されていません</p>
            <a href="/trials/new" className="text-sm bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors">最初の事件を登録する</a>
          </div>
        )}

        <div className="space-y-3">
          {trials.map(trial => (
            <div key={trial.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor(trial.case_status)}`}>{trial.case_status}</span>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{trial.case_type}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">{trial.court_name}</h3>
                  {trial.case_number && <p className="text-sm text-gray-500 mt-0.5">事件番号：{trial.case_number}</p>}
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <span>期日 {trial.hearing_count} 回</span>
                    <span>更新：{new Date(trial.updated_at).toLocaleDateString("ja-JP")}</span>
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/trials/new?trial_id=${trial.id}`)}
                  className="ml-4 text-sm bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg font-medium hover:bg-indigo-100 transition-colors whitespace-nowrap"
                >
                  期日を追加する
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
