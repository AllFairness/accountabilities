import { NextRequest, NextResponse } from "next/server";
import { promises as dns } from "dns";
import { sendTelegram, jstNow } from "@/lib/telegram";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

async function resolveHost(ip: string): Promise<string> {
  try {
    const hostnames = await dns.reverse(ip);
    return hostnames[0] ?? "逆引き不可";
  } catch {
    return "逆引き不可";
  }
}

function extractIp(request: NextRequest): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "不明";
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.event) return NextResponse.json({ ok: false }, { status: 400 });

  const { event, data } = body;
  let message = "";

  switch (event) {
    case "access": {
      const ip = extractIp(request);
      const host = await resolveHost(ip);
      const path = data?.path ?? "/";
      const referrer = data?.referrer || "";
      message = `🌐 サイト訪問\nページ: ${path}\nリファラー: ${referrer || "直接"}\nIP: ${ip}\nホスト: ${host}\n時刻: ${jstNow()}`;
      pool.query("INSERT INTO page_views (path, referrer) VALUES ($1, $2)", [path, referrer || null]).catch(() => {});
      break;
    }
    case "signup":
      message = `👤 新規ユーザー登録\n時刻: ${jstNow()}`;
      break;
    case "trial_created":
      message = `✅ 訴訟記録が投稿されました\n事件番号: ${data?.case_number || "未入力"}\n裁判所: ${data?.court_name || "不明"}\n時刻: ${jstNow()}`;
      break;
    case "form_abandoned":
      message = `⚠️ フォーム離脱\nステップ: ステップ${data?.step}/3\n時刻: ${jstNow()}`;
      break;
    default:
      return NextResponse.json({ ok: false }, { status: 400 });
  }

  await sendTelegram(message);
  return NextResponse.json({ ok: true });
}
