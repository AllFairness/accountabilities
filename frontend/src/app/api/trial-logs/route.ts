import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
export const runtime = 'nodejs';

interface JudgeInput {
  judge_name: string;
  role: string;
  judge_delayed: boolean;
  judge_clarification: boolean;
  judge_interrupted: boolean;
  judge_unprepared: boolean;
}

interface LawyerInput {
  lawyer_name: string;
  side: string;
  lawyer_deadline_met: boolean;
  lawyer_false_claim: boolean;
  lawyer_obstruction: boolean;
}

interface PartyInput {
  side: string;
  appeared: boolean;
  represented: boolean;
}

export async function POST(request: NextRequest) {
  const client = await pool.connect();
  try {
    const body = await request.json();
    const {
      trial_id,
      court_name, case_number, case_type, hearing_date,
      is_collegial, case_status, outcome,
      judges, lawyers, parties,
    } = body;

    if (!court_name || !case_type || !hearing_date) {
      return NextResponse.json({ error: '必須項目が不足しています（裁判所名・事件種別・期日日付）' }, { status: 400 });
    }

    await client.query('BEGIN');

    const trialRes = await client.query(
      `INSERT INTO trial_logs (trial_id, court_name, case_number, case_type, hearing_date, is_collegial, case_status, outcome)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [trial_id ?? null, court_name, case_number || null, case_type, hearing_date, is_collegial ?? false, case_status, outcome]
    );
    const logId: number = trialRes.rows[0].id;

    for (const j of (judges as JudgeInput[] ?? [])) {
      await client.query(
        `INSERT INTO trial_judges (trial_log_id, judge_name, role, judge_delayed, judge_clarification, judge_interrupted, judge_unprepared)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [logId, j.judge_name, j.role, j.judge_delayed, j.judge_clarification, j.judge_interrupted, j.judge_unprepared]
      );
    }

    for (const l of (lawyers as LawyerInput[] ?? [])) {
      await client.query(
        `INSERT INTO trial_lawyers (trial_log_id, lawyer_name, side, lawyer_deadline_met, lawyer_false_claim, lawyer_obstruction)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [logId, l.lawyer_name, l.side, l.lawyer_deadline_met, l.lawyer_false_claim, l.lawyer_obstruction]
      );
    }

    for (const p of (parties as PartyInput[] ?? [])) {
      await client.query(
        `INSERT INTO trial_parties (trial_log_id, side, appeared, represented)
         VALUES ($1, $2, $3, $4)`,
        [logId, p.side, p.appeared, p.represented]
      );
    }

    await client.query('COMMIT');
    return NextResponse.json({ id: logId }, { status: 201 });

  } catch (e) {
    await client.query('ROLLBACK');
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}
