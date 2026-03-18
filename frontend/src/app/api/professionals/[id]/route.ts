import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

interface ProfRow {
  id: number;
  name: string;
  profession_type: string;
  organization: string | null;
  stance_axis1: number;
  stance_axis2: number;
  confidence: number;
  record_count: number;
}

const COLORS: Record<string, string> = {
  裁判官: '#6366f1', 弁護士: '#10b981', 医師: '#f59e0b', 公務員: '#ef4444',
};
function color(t: string) {
  for (const [k, v] of Object.entries(COLORS)) if (t.includes(k)) return v;
  return '#6b7280';
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const isAuthenticated = !!session?.user;
    const id = parseInt(params.id);
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const rows = await query<ProfRow>(
      'SELECT id,name,profession_type,organization,stance_axis1,stance_axis2,confidence,record_count FROM professionals WHERE id=$1',
      [id]
    );
    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const r = rows[0];
    const data = {
      id: String(r.id),
      name: r.name,
      profession: r.profession_type,
      organization: r.organization ?? '',
      color: color(r.profession_type),
      cases: r.record_count,
      x: r.stance_axis1,
      y: r.stance_axis2,
      transparency: isAuthenticated ? r.stance_axis1 : null,
      accountability: isAuthenticated ? r.stance_axis2 : null,
      confidence: isAuthenticated ? r.confidence : null,
    };
    return NextResponse.json({ data, authenticated: isAuthenticated }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
