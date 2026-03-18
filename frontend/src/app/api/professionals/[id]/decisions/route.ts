import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

interface DecisionRow {
  id: number;
  decision_id: string;
  decision_type: string | null;
  organization: string | null;
  decision_date: string | null;
  case_number: string | null;
  title: string | null;
  summary: string | null;
  source_url: string | null;
}

interface CountRow {
  total: string;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const isAuthenticated = !!session?.user;
    const professionalId = parseInt(params.id);

    if (isNaN(professionalId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const countRows = await query<CountRow>(
      `SELECT COUNT(*) AS total
       FROM decisions d
       JOIN decision_professionals dp ON dp.decision_id = d.id
       WHERE dp.professional_id = $1`,
      [professionalId]
    );
    const total = parseInt(countRows[0]?.total ?? '0');

    if (!isAuthenticated) {
      return NextResponse.json(
        { total, authenticated: false, details: null },
        { headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const rows = await query<DecisionRow>(
      `SELECT d.id, d.decision_id, d.decision_type, d.organization, d.decision_date,
              d.case_number, d.title, d.summary, d.source_url
       FROM decisions d
       JOIN decision_professionals dp ON dp.decision_id = d.id
       WHERE dp.professional_id = $1
       ORDER BY d.decision_date DESC NULLS LAST`,
      [professionalId]
    );

    return NextResponse.json(
      { total, authenticated: true, details: rows },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
