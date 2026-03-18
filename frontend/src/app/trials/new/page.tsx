"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Judge = {
  name: string;
  role: string;
  delayed: boolean;
  clarification: boolean;
  interrupted: boolean;
  unprepared: boolean;
};

type Lawyer = {
  name: string;
  side: string;
  deadlineMet: boolean;
  falseClaim: boolean;
  obstruction: boolean;
};

const JUDGE_ATTITUDES = [
  { field: "delayed" as const, label: "期日の遅延あり" },
  { field: "clarification" as const, label: "釈明権の行使あり" },
  { field: "interrupted" as const, label: "当事者の発言を遮った" },
  { field: "unprepared" as const, label: "準備書面を読んでいない様子だった" },
];

const LAWYER_ATTITUDES = [
  { field: "deadlineMet" as const, label: "準備書面の期限遵守" },
  { field: "falseClaim" as const, label: "虚偽と思われる主張あり" },
  { field: "obstruction" as const, label: "手続き妨害と思われる行動あり" },
];

const SINGLE_JUDGE: Judge = { name: "", role: "単独", delayed: false, clarification: false, interrupted: false, unprepared: false };
const COLLEGIAL_JUDGES: Judge[] = [
  { name: "", role: "裁判長", delayed: false, clarification: false, interrupted: false, unprepared: false },
  { name: "", role: "右陪席", delayed: false, clarification: false, interrupted: false, unprepared: false },
  { name: "", role: "左陪席", delayed: false, clarification: false, interrupted: false, unprepared: false },
];

export default function NewTrialPage() {
  const router = useRouter();

  // 基本情報
  const [caseType, setCaseType] = useState("通常民事");
  const [courtName, setCourtName] = useState("");
  const [caseNumber, setCaseNumber] = useState("");
  const [hearingDate, setHearingDate] = useState("");

  // 裁判体
  const [isCollegial, setIsCollegial] = useState(false);
  const [judges, setJudges] = useState<Judge[]>([{ ...SINGLE_JUDGE }]);

  // 弁護士
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);

  // 当事者
  const [plaintiffAppeared, setPlaintiffAppeared] = useState(false);
  const [plaintiffRepresented, setPlaintiffRepresented] = useState(false);
  const [defendantAppeared, setDefendantAppeared] = useState(false);
  const [defendantRepresented, setDefendantRepresented] = useState(false);

  // 結果
  const [caseStatus, setCaseStatus] = useState("継続中");
  const [outcome, setOutcome] = useState("継続中");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCollegialChange = (v: boolean) => {
    setIsCollegial(v);
    setJudges(v ? COLLEGIAL_JUDGES.map(j => ({ ...j })) : [{ ...SINGLE_JUDGE }]);
  };

  const updateJudge = (i: number, field: keyof Judge, value: string | boolean) =>
    setJudges(prev => prev.map((j, idx) => idx === i ? { ...j, [field]: value } : j));

  const addLawyer = () =>
    setLawyers(prev => [...prev, { name: "", side: "原告側", deadlineMet: false, falseClaim: false, obstruction: false }]);

  const updateLawyer = (i: number, field: keyof Lawyer, value: string | boolean) =>
    setLawyers(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l));

  const removeLawyer = (i: number) =>
    setLawyers(prev => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/trials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          court_name: courtName,
          case_number: caseNumber,
          case_type: caseType,
          hearing_date: hearingDate,
          is_collegial: isCollegial,
          case_status: caseStatus,
          outcome,
          judges: judges.map(j => ({
            judge_name: j.name, role: j.role,
            judge_delayed: j.delayed, judge_clarification: j.clarification,
            judge_interrupted: j.interrupted, judge_unprepared: j.unprepared,
          })),
          lawyers: lawyers.map(l => ({
            lawyer_name: l.name, side: l.side,
            lawyer_deadline_met: l.deadlineMet, lawyer_false_claim: l.falseClaim,
            lawyer_obstruction: l.obstruction,
          })),
          parties: [
            { side: "原告", appeared: plaintiffAppeared, represented: plaintiffRepresented },
            { side: "被告", appeared: defendantAppeared, represented: defendantRepresented },
          ],
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `HTTP ${res.status}`);
      router.push("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "送信に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">訴訟記録を投稿する</h1>
            <p className="text-sm text-gray-500 mt-0.5">民事訴訟・人事訴訟の期日記録を投稿してください</p>
          </div>
          <a href="/" className="text-sm text-gray-500 hover:text-gray-700">← 戻る</a>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">

          {/* 【1】基本情報 */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">【1】基本情報</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">事件種別 <span className="text-red-500">*</span></label>
                <select value={caseType} onChange={e => setCaseType(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option>通常民事</option>
                  <option>人事訴訟</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">裁判所名 <span className="text-red-500">*</span></label>
                <input type="text" value={courtName} onChange={e => setCourtName(e.target.value)} required placeholder="例：東京地方裁判所" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">事件番号</label>
                <input type="text" value={caseNumber} onChange={e => setCaseNumber(e.target.value)} placeholder="例：令6（ワ）1234号" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">期日日付 <span className="text-red-500">*</span></label>
                <input type="date" value={hearingDate} onChange={e => setHearingDate(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
          </section>

          {/* 【2】裁判体 */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">【2】裁判体</h2>
            <label className="flex items-center gap-2 mb-5 cursor-pointer">
              <input type="checkbox" checked={isCollegial} onChange={e => handleCollegialChange(e.target.checked)} className="w-4 h-4 text-indigo-600 rounded" />
              <span className="text-sm font-medium text-gray-700">合議体（3名）</span>
            </label>
            <div className="space-y-4">
              {judges.map((judge, i) => (
                <div key={i} className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{judge.role}</span>
                    <input type="text" value={judge.name} onChange={e => updateJudge(i, "name", e.target.value)} placeholder="裁判官名" className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {JUDGE_ATTITUDES.map(({ field, label }) => (
                      <label key={field} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={judge[field] as boolean} onChange={e => updateJudge(i, field, e.target.checked)} className="w-3.5 h-3.5 text-indigo-600 rounded" />
                        <span className="text-xs text-gray-600">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 【3】相手方弁護士 */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-800">【3】相手方弁護士</h2>
              <button type="button" onClick={addLawyer} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">+ 弁護士を追加</button>
            </div>
            {lawyers.length === 0 && <p className="text-sm text-gray-400">弁護士を追加してください（任意）</p>}
            <div className="space-y-4">
              {lawyers.map((lawyer, i) => (
                <div key={i} className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center gap-2 mb-3">
                    <input type="text" value={lawyer.name} onChange={e => updateLawyer(i, "name", e.target.value)} placeholder="弁護士名" className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    <select value={lawyer.side} onChange={e => updateLawyer(i, "side", e.target.value)} className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option>原告側</option>
                      <option>被告側</option>
                    </select>
                    <button type="button" onClick={() => removeLawyer(i)} className="text-gray-400 hover:text-red-500 text-lg leading-none px-1">×</button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {LAWYER_ATTITUDES.map(({ field, label }) => (
                      <label key={field} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={lawyer[field] as boolean} onChange={e => updateLawyer(i, field, e.target.checked)} className="w-3.5 h-3.5 text-indigo-600 rounded" />
                        <span className="text-xs text-gray-600">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 【4】当事者出廷 */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">【4】当事者出廷</h2>
            <div className="grid grid-cols-2 gap-6">
              {[
                { label: "原告", appeared: plaintiffAppeared, setAppeared: setPlaintiffAppeared, represented: plaintiffRepresented, setRepresented: setPlaintiffRepresented },
                { label: "被告", appeared: defendantAppeared, setAppeared: setDefendantAppeared, represented: defendantRepresented, setRepresented: setDefendantRepresented },
              ].map(({ label, appeared, setAppeared, represented, setRepresented }) => (
                <div key={label}>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">{label}</h3>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={appeared} onChange={e => setAppeared(e.target.checked)} className="w-4 h-4 text-indigo-600 rounded" />
                      <span className="text-sm text-gray-600">本人出廷あり</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={represented} onChange={e => setRepresented(e.target.checked)} className="w-4 h-4 text-indigo-600 rounded" />
                      <span className="text-sm text-gray-600">代理人のみ</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 【5】結果 */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">【5】結果</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">訴訟の現状</label>
                <select value={caseStatus} onChange={e => setCaseStatus(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option>継続中</option>
                  <option>判決</option>
                  <option>和解</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">結果</label>
                <select value={outcome} onChange={e => setOutcome(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option>継続中</option>
                  <option>勝訴</option>
                  <option>敗訴</option>
                  <option>一部勝訴</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">判決文アップロード（任意）</label>
                <input type="file" accept=".pdf,.doc,.docx" className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
              </div>
            </div>
          </section>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <div className="flex gap-4">
            <button type="submit" disabled={submitting} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {submitting ? "送信中..." : "記録を投稿する"}
            </button>
            <a href="/" className="px-6 py-3 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">キャンセル</a>
          </div>

        </form>
      </div>
    </main>
  );
}
