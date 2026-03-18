import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

interface ConductRow {
  id: number;
  log_date: string;
  organization: string | null;
  case_number: string | null;
  log_type: string | null;
  conduct_notes: string | null;
  outcome_notes: string | null;
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
      'SELECT COUNT(*) AS total FROM conduct_logs WHERE professional_id = $1',
      [professionalId]
    );
    const total = parseInt(countRows[0]?.total ?? '0');

    if (!isAuthenticated) {
      return NextResponse.json(
        { total, authenticated: false, details: null },
        { headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const rows = await query<ConductRow>(
      `SELECT id, log_date, organization, case_number, log_type, conduct_notes, outcome_notes
       FROM conduct_logs WHERE professional_id = $1 ORDER BY log_date DESC`,
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
