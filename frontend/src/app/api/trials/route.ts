import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { pool } from '@/lib/db';
export const runtime = 'nodejs';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const res = await pool.query(
      `SELECT t.*,
        (SELECT COUNT(*) FROM trial_logs tl WHERE tl.trial_id = t.id) AS hearing_count
       FROM trials t
       WHERE t.user_email = $1
       ORDER BY t.updated_at DESC`,
      [session.user.email]
    );
    return NextResponse.json({ data: res.rows });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { court_name, case_number, case_type, complaint_url } = body;

    if (!court_name || !case_type) {
      return NextResponse.json({ error: '裁判所名と事件種別は必須です' }, { status: 400 });
    }

    const res = await pool.query(
      `INSERT INTO trials (user_email, court_name, case_number, case_type, complaint_url)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [session.user.email, court_name, case_number || null, case_type, complaint_url || null]
    );
    return NextResponse.json(res.rows[0], { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
