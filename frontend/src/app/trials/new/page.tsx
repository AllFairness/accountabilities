"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

// ---- 型定義 ----
type Judge = { judge_name: string; role: string; judge_delayed: boolean; judge_clarification: boolean; judge_interrupted: boolean; judge_unprepared: boolean; };
type Lawyer = { lawyer_name: string; side: string; lawyer_deadline_met: boolean; lawyer_false_claim: boolean; lawyer_obstruction: boolean; };
type Hearing = { id: number; hearing_date: string; is_collegial: boolean; case_status: string; outcome: string | null; judges: Judge[] | null; lawyers: Lawyer[] | null; };

const SINGLE_JUDGE = (): Judge => ({ judge_name: "", role: "単独", judge_delayed: false, judge_clarification: false, judge_interrupted: false, judge_unprepared: false });
const COLLEGIAL_JUDGES = (): Judge[] => [
  { judge_name: "", role: "裁判長", judge_delayed: false, judge_clarification: false, judge_interrupted: false, judge_unprepared: false },
  { judge_name: "", role: "右陪席", judge_delayed: false, judge_clarification: false, judge_interrupted: false, judge_unprepared: false },
  { judge_name: "", role: "左陪席", judge_delayed: false, judge_clarification: false, judge_interrupted: false, judge_unprepared: false },
];
const JUDGE_CHECKS = [
  { field: "judge_delayed" as const, label: "期日の遅延あり" },
  { field: "judge_clarification" as const, label: "釈明権の行使あり" },
  { field: "judge_interrupted" as const, label: "当事者の発言を遮った" },
  { field: "judge_unprepared" as const, label: "準備書面を読んでいない様子だった" },
];
const LAWYER_CHECKS = [
  { field: "lawyer_deadline_met" as const, label: "期限を守らなかった" },
  { field: "lawyer_false_claim" as const, label: "虚偽の主張をした" },
  { field: "lawyer_obstruction" as const, label: "訴訟妨害的な行動をした" },
];

// ---- Step インジケーター ----
function StepIndicator({ step }: { step: number }) {
  const steps = ["事件登録", "期日記録", "判決記録"];
  return (
    <div className="flex items-center gap-2 mb-8">
      {steps.map((label, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i + 1 <= step ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-400"}`}>{i + 1}</div>
          <span className={`text-sm ${i + 1 === step ? "font-semibold text-gray-800" : "text-gray-400"}`}>{label}</span>
          {i < steps.length - 1 && <div className={`w-8 h-0.5 ${i + 1 < step ? "bg-indigo-400" : "bg-gray-200"}`} />}
        </div>
      ))}
    </div>
  );
}

// ---- Step 1: 事件登録 ----
function Step1({ onComplete }: { onComplete: (trialId: number) => void }) {
  const [courtName, setCourtName] = useState("");
  const [caseNumber, setCaseNumber] = useState("");
  const [caseType, setCaseType] = useState("通常民事");
  const [complaintUrl, setComplaintUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setError(null);
    try {
      const res = await fetch("/api/trials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ court_name: courtName, case_number: caseNumber, case_type: caseType, complaint_url: complaintUrl }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `HTTP ${res.status}`);
      const data = await res.json();
      onComplete(data.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "登録に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">事件種別 <span className="text-red-500">*</span></label>
            <select value={caseType} onChange={e => setCaseType(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option>通常民事</option>
              <option>人事訴訟</option>
              <option>その他</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">裁判所名 <span className="text-red-500">*</span></label>
            <input type="text" value={courtName} onChange={e => setCourtName(e.target.value)} required placeholder="例：東京地方裁判所" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">事件番号（任意）</label>
            <input type="text" value={caseNumber} onChange={e => setCaseNumber(e.target.value)} placeholder="例：令6（ワ）1234号" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">訴状PDF URL（任意）</label>
            <input type="url" value={complaintUrl} onChange={e => setComplaintUrl(e.target.value)} placeholder="https://..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
      </div>
      {error && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>}
      <button type="submit" disabled={submitting} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors">
        {submitting ? "登録中..." : "事件を登録して期日を追加する →"}
      </button>
    </form>
  );
}

// ---- Step 2: 期日記録 ----
function Step2({ trialId, onJudgment, onFinish }: { trialId: number; onJudgment: () => void; onFinish: () => void }) {
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [hearingDate, setHearingDate] = useState("");
  const [isCollegial, setIsCollegial] = useState(false);
  const [judges, setJudges] = useState<Judge[]>([SINGLE_JUDGE()]);
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [plaintiffAppeared, setPlaintiffAppeared] = useState(false);
  const [plaintiffRepresented, setPlaintiffRepresented] = useState(false);
  const [defendantAppeared, setDefendantAppeared] = useState(false);
  const [defendantRepresented, setDefendantRepresented] = useState(false);
  const [caseStatus, setCaseStatus] = useState("継続中");
  const [outcome, setOutcome] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHearings = useCallback(async () => {
    try {
      const res = await fetch(`/api/trials/${trialId}`);
      if (!res.ok) return;
      const data = await res.json();
      setHearings(data.hearings ?? []);
    } catch {}
  }, [trialId]);

  useEffect(() => { fetchHearings(); }, [fetchHearings]);

  const handleCollegialChange = (v: boolean) => {
    setIsCollegial(v);
    setJudges(v ? COLLEGIAL_JUDGES() : [SINGLE_JUDGE()]);
  };

  const updateJudge = (i: number, field: keyof Judge, value: string | boolean) =>
    setJudges(prev => prev.map((j, idx) => idx === i ? { ...j, [field]: value } : j));

  const addLawyer = () => setLawyers(prev => [...prev, { lawyer_name: "", side: "原告側", lawyer_deadline_met: false, lawyer_false_claim: false, lawyer_obstruction: false }]);
  const updateLawyer = (i: number, field: keyof Lawyer, value: string | boolean) =>
    setLawyers(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l));
  const removeLawyer = (i: number) => setLawyers(prev => prev.filter((_, idx) => idx !== i));

  const resetForm = () => {
    setHearingDate(""); setIsCollegial(false); setJudges([SINGLE_JUDGE()]); setLawyers([]);
    setPlaintiffAppeared(false); setPlaintiffRepresented(false);
    setDefendantAppeared(false); setDefendantRepresented(false);
    setCaseStatus("継続中"); setOutcome("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setError(null);
    try {
      const res = await fetch(`/api/trials/${trialId}/hearings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hearing_date: hearingDate, is_collegial: isCollegial, case_status: caseStatus, outcome: outcome || null,
          judges, lawyers,
          parties: [
            { side: "原告", appeared: plaintiffAppeared, represented: plaintiffRepresented },
            { side: "被告", appeared: defendantAppeared, represented: defendantRepresented },
          ],
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `HTTP ${res.status}`);
      await fetchHearings();
      resetForm();
      if (caseStatus === "判決") onJudgment();
    } catch (e) {
      setError(e instanceof Error ? e.message : "送信に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 登録済み期日一覧 */}
      {hearings.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">登録済みの期日（{hearings.length}件）</h3>
          <div className="space-y-2">
            {hearings.map(h => (
              <div key={h.id} className="flex items-center justify-between text-sm py-2 border-b border-gray-100 last:border-0">
                <span className="font-medium text-gray-800">{h.hearing_date}</span>
                <span className="text-gray-500">{h.is_collegial ? "合議" : "単独"}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${h.case_status === "判決" ? "bg-red-100 text-red-700" : h.case_status === "和解" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{h.case_status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 期日入力フォーム */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
          <h3 className="text-base font-semibold text-gray-800">期日を追加</h3>

          {/* 期日日付 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">期日日付 <span className="text-red-500">*</span></label>
            <input type="date" value={hearingDate} onChange={e => setHearingDate(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          {/* 裁判体 */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">裁判体</h4>
            <label className="flex items-center gap-2 mb-3 cursor-pointer">
              <input type="checkbox" checked={isCollegial} onChange={e => handleCollegialChange(e.target.checked)} className="w-4 h-4 text-indigo-600 rounded" />
              <span className="text-sm text-gray-700">合議体（3名）</span>
            </label>
            <div className="space-y-3">
              {judges.map((judge, i) => (
                <div key={i} className="border border-gray-100 rounded-lg p-3 bg-gray-50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{judge.role}</span>
                    <input type="text" value={judge.judge_name} onChange={e => updateJudge(i, "judge_name", e.target.value)} placeholder="裁判官名" className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {JUDGE_CHECKS.map(({ field, label }) => (
                      <label key={field} className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={judge[field] as boolean} onChange={e => updateJudge(i, field, e.target.checked)} className="w-3.5 h-3.5 text-indigo-600 rounded" />
                        <span className="text-xs text-gray-600">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 相手方弁護士 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-700">相手方弁護士（任意）</h4>
              <button type="button" onClick={addLawyer} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">+ 追加</button>
            </div>
            {lawyers.length === 0 && <p className="text-xs text-gray-400">任意項目です</p>}
            <div className="space-y-3">
              {lawyers.map((lawyer, i) => (
                <div key={i} className="border border-gray-100 rounded-lg p-3 bg-gray-50">
                  <div className="flex items-center gap-2 mb-2">
                    <input type="text" value={lawyer.lawyer_name} onChange={e => updateLawyer(i, "lawyer_name", e.target.value)} placeholder="弁護士名" className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    <select value={lawyer.side} onChange={e => updateLawyer(i, "side", e.target.value)} className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none">
                      <option>原告側</option><option>被告側</option>
                    </select>
                    <button type="button" onClick={() => removeLawyer(i)} className="text-gray-400 hover:text-red-500 text-lg px-1">×</button>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {LAWYER_CHECKS.map(({ field, label }) => (
                      <label key={field} className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={lawyer[field] as boolean} onChange={e => updateLawyer(i, field, e.target.checked)} className="w-3.5 h-3.5 text-indigo-600 rounded" />
                        <span className="text-xs text-gray-600">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 当事者出廷 */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">当事者出廷</h4>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "原告", appeared: plaintiffAppeared, setAppeared: setPlaintiffAppeared, represented: plaintiffRepresented, setRepresented: setPlaintiffRepresented },
                { label: "被告", appeared: defendantAppeared, setAppeared: setDefendantAppeared, represented: defendantRepresented, setRepresented: setDefendantRepresented },
              ].map(({ label, appeared, setAppeared, represented, setRepresented }) => (
                <div key={label}>
                  <p className="text-xs font-medium text-gray-600 mb-1">{label}</p>
                  <div className="space-y-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={appeared} onChange={e => setAppeared(e.target.checked)} className="w-3.5 h-3.5 text-indigo-600 rounded" />
                      <span className="text-xs text-gray-600">本人出廷あり</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={represented} onChange={e => setRepresented(e.target.checked)} className="w-3.5 h-3.5 text-indigo-600 rounded" />
                      <span className="text-xs text-gray-600">代理人のみ</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 訴訟の現状・結果 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">訴訟の現状</label>
              <select value={caseStatus} onChange={e => setCaseStatus(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option>継続中</option><option>判決</option><option>和解</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">結果</label>
              <select value={outcome} onChange={e => setOutcome(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">---</option>
                <option>継続中</option><option>勝訴</option><option>敗訴</option><option>一部勝訴</option>
              </select>
            </div>
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="flex gap-3">
          <button type="submit" disabled={submitting} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {submitting ? "追加中..." : caseStatus === "判決" ? "期日を追加して判決記録へ →" : "この期日を追加する"}
          </button>
          <button type="button" onClick={onFinish} className="px-5 py-3 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">完了</button>
        </div>
      </form>
    </div>
  );
}

// ---- Step 3: 判決記録 ----
function Step3({ trialId, onComplete }: { trialId: number; onComplete: () => void }) {
  const [judgmentUrl, setJudgmentUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setError(null);
    try {
      const res = await fetch(`/api/trials/${trialId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ case_status: "判決", judgment_url: judgmentUrl || null }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `HTTP ${res.status}`);
      onComplete();
    } catch (e) {
      setError(e instanceof Error ? e.message : "更新に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
          判決が記録されました。判決文のURLがあれば登録してください（任意）。
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">判決文PDF URL（任意）</label>
          <input type="url" value={judgmentUrl} onChange={e => setJudgmentUrl(e.target.value)} placeholder="https://..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
      </div>
      {error && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>}
      <div className="flex gap-3">
        <button type="submit" disabled={submitting} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors">
          {submitting ? "保存中..." : "記録を完了する"}
        </button>
        <button type="button" onClick={onComplete} className="px-5 py-3 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50">スキップ</button>
      </div>
    </form>
  );
}

// ---- メインページ ----
export default function NewTrialPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [trialId, setTrialId] = useState<number | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") signIn();
  }, [status]);

  if (status === "loading") {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;
  }
  if (!session) return null;

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">訴訟記録を投稿する</h1>
            <p className="text-sm text-gray-500 mt-0.5">{session.user?.email}</p>
          </div>
          <a href="/trials" className="text-sm text-gray-500 hover:text-gray-700">マイページ</a>
        </div>
      </header>
      <div className="max-w-3xl mx-auto px-6 py-8">
        <StepIndicator step={step} />
        {step === 1 && <Step1 onComplete={id => { setTrialId(id); setStep(2); }} />}
        {step === 2 && trialId && <Step2 trialId={trialId} onJudgment={() => setStep(3)} onFinish={() => router.push("/trials")} />}
        {step === 3 && trialId && <Step3 trialId={trialId} onComplete={() => router.push("/trials")} />}
      </div>
    </main>
  );
}
