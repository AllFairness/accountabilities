import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const trialId = parseInt(params.id);
  const client = await pool.connect();
  try {
    // 所有権確認
    const ownerCheck = await client.query(
      'SELECT id FROM trials WHERE id = $1 AND user_email = $2',
      [trialId, session.user.email]
    );
    if (ownerCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const body = await request.json();
    const { hearing_date, is_collegial, case_status, outcome, judges, lawyers, parties } = body;

    if (!hearing_date) {
      return NextResponse.json({ error: '期日日付は必須です' }, { status: 400 });
    }

    // trialsテーブルのcase_statusも更新（'判決'の場合）
    const trialMeta = await client.query(
      'SELECT court_name, case_type FROM trials WHERE id = $1',
      [trialId]
    );
    const { court_name, case_type } = trialMeta.rows[0];

    await client.query('BEGIN');

    const logRes = await client.query(
      `INSERT INTO trial_logs (trial_id, court_name, case_type, hearing_date, is_collegial, case_status, outcome)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [trialId, court_name, case_type, hearing_date, is_collegial ?? false, case_status ?? '継続中', outcome ?? null]
    );
    const logId: number = logRes.rows[0].id;

    for (const j of (judges as JudgeInput[] ?? [])) {
      if (!j.judge_name) continue;
      await client.query(
        `INSERT INTO trial_judges (trial_log_id, judge_name, role, judge_delayed, judge_clarification, judge_interrupted, judge_unprepared)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [logId, j.judge_name, j.role, j.judge_delayed, j.judge_clarification, j.judge_interrupted, j.judge_unprepared]
      );
    }

    for (const l of (lawyers as LawyerInput[] ?? [])) {
      if (!l.lawyer_name) continue;
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

    // trialsのupdated_at更新
    await client.query(
      'UPDATE trials SET updated_at = now() WHERE id = $1',
      [trialId]
    );

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
