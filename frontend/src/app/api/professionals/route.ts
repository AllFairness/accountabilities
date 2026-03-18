import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/lib/auth';

export const runtime = 'nodejs';

interface Row {
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
  裁判官: '#6366f1',
  弁護士: '#10b981',
  医師: '#f59e0b',
  公務員: '#ef4444',
};

function color(t: string) {
  for (const [k, v] of Object.entries(COLORS)) if (t.includes(k)) return v;
  return '#6b7280';
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const isAuthenticated = !!session?.user;

    const p = new URL(request.url).searchParams;
    const minConf = parseFloat(p.get('min_confidence') ?? '0.3');
    const limit = Math.min(parseInt(p.get('limit') ?? '100'), 500);
    const offset = parseInt(p.get('offset') ?? '0');
    const pt = p.get('profession_type');

    const conds = ['confidence > $1'];
    const params: unknown[] = [minConf];
    let i = 2;
    if (pt) { conds.push(`profession_type = $${i}`); params.push(pt); i++; }
    const where = conds.join(' AND ');
    params.push(limit, offset);

    const rows = await query<Row>(
      `SELECT id,name,profession_type,organization,stance_axis1,stance_axis2,confidence,record_count FROM professionals WHERE ${where} ORDER BY record_count DESC LIMIT $${i} OFFSET $${i + 1}`,
      params
    );
    const countRows = await query<{ total: string }>(
      `SELECT COUNT(*) AS total FROM professionals WHERE ${where}`,
      params.slice(0, i - 1)
    );

    const data = rows.map(r => ({
      id: String(r.id),
      name: r.name,
      profession: r.profession_type,
      organization: r.organization ?? '',
      // 認証済みユーザーのみスコア数値を返す
      // ゲストにはチャート描画用の座標のみ返す（数値ラベルは非表示）
      transparency: isAuthenticated ? r.stance_axis1 : null,
      accountability: isAuthenticated ? r.stance_axis2 : null,
      // チャート描画用座標（全ユーザーに返す）
      x: r.stance_axis1,
      y: r.stance_axis2,
      confidence: isAuthenticated ? r.confidence : null,
      cases: r.record_count,
      color: color(r.profession_type),
    }));

    return NextResponse.json(
      { data, total: parseInt(countRows[0]?.total ?? '0'), limit, offset, authenticated: isAuthenticated },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
