import { NextRequest, NextResponse } from "next/server";
import { sendTelegram, jstNow } from "@/lib/telegram";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.event) return NextResponse.json({ ok: false }, { status: 400 });

  const { event, data } = body;
  let message = "";

  switch (event) {
    case "access":
      message = `🌐 サイト訪問\nページ: ${data?.path ?? "/"}\nリファラー: ${data?.referrer || "直接"}\n時刻: ${jstNow()}`;
      break;
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
