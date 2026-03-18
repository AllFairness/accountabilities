import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { pool } from '@/lib/db';
export const runtime = 'nodejs';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const trialId = parseInt(params.id);
  try {
    const trialRes = await pool.query(
      'SELECT * FROM trials WHERE id = $1 AND user_email = $2',
      [trialId, session.user.email]
    );
    if (trialRes.rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const hearingsRes = await pool.query(
      `SELECT tl.*,
        json_agg(DISTINCT jsonb_build_object('id', tj.id, 'judge_name', tj.judge_name, 'role', tj.role,
          'judge_delayed', tj.judge_delayed, 'judge_clarification', tj.judge_clarification,
          'judge_interrupted', tj.judge_interrupted, 'judge_unprepared', tj.judge_unprepared)
        ) FILTER (WHERE tj.id IS NOT NULL) AS judges,
        json_agg(DISTINCT jsonb_build_object('id', tla.id, 'lawyer_name', tla.lawyer_name, 'side', tla.side,
          'lawyer_deadline_met', tla.lawyer_deadline_met, 'lawyer_false_claim', tla.lawyer_false_claim,
          'lawyer_obstruction', tla.lawyer_obstruction)
        ) FILTER (WHERE tla.id IS NOT NULL) AS lawyers
       FROM trial_logs tl
       LEFT JOIN trial_judges tj ON tj.trial_log_id = tl.id
       LEFT JOIN trial_lawyers tla ON tla.trial_log_id = tl.id
       WHERE tl.trial_id = $1
       GROUP BY tl.id
       ORDER BY tl.hearing_date`,
      [trialId]
    );

    return NextResponse.json({ trial: trialRes.rows[0], hearings: hearingsRes.rows });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const trialId = parseInt(params.id);
  try {
    const body = await request.json();
    const { case_status, judgment_url } = body;

    const res = await pool.query(
      `UPDATE trials SET case_status = COALESCE($1, case_status), judgment_url = COALESCE($2, judgment_url), updated_at = now()
       WHERE id = $3 AND user_email = $4 RETURNING *`,
      [case_status || null, judgment_url || null, trialId, session.user.email]
    );
    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(res.rows[0]);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
