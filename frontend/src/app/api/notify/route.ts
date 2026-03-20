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

function parseUserAgent(ua: string): { browser: string; device: string; os: string } {
  const mobile = /Mobile|Android|iPhone|iPod/i.test(ua);
  const tablet = /iPad|Android(?!.*Mobile)/i.test(ua);

  let browser = "不明";
  if (/Edg\//i.test(ua))                              browser = "Edge";
  else if (/SamsungBrowser/i.test(ua))                browser = "Samsung Internet";
  else if (/Chrome\//i.test(ua))                      browser = "Chrome";
  else if (/Firefox\//i.test(ua))                     browser = "Firefox";
  else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";
  else if (/MSIE|Trident/i.test(ua))                  browser = "IE";

  let os = "不明";
  if (/iPhone|iPad|iPod/i.test(ua))      os = "iOS";
  else if (/Android/i.test(ua))          os = "Android";
  else if (/Windows/i.test(ua))          os = "Windows";
  else if (/Macintosh|Mac OS X/i.test(ua)) os = "macOS";
  else if (/Linux/i.test(ua))            os = "Linux";

  const device = tablet ? "📱 タブレット" : mobile ? "📱 スマホ" : "🖥️ PC";

  return { browser, device, os };
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

      const prev = parseInt(request.cookies.get("visit_count")?.value ?? "0", 10);
      const visitCount = prev + 1;
      const visitLabel = visitCount === 1 ? "🆕 初回訪問" : `🔁 ${visitCount}回目の訪問`;

      const ua = request.headers.get("user-agent") ?? "";
      const { browser, device, os } = parseUserAgent(ua);

      message = `🌐 サイト訪問\nページ: ${path}\nリファラー: ${referrer || "直接"}\nIP: ${ip}\nホスト: ${host}\n${visitLabel}\n${device}  ${browser} / ${os}\n時刻: ${jstNow()}`;
      pool.query("INSERT INTO page_views (path, referrer) VALUES ($1, $2)", [path, referrer || null]).catch(() => {});

      await sendTelegram(message);
      const res = NextResponse.json({ ok: true });
      res.cookies.set("visit_count", String(visitCount), {
        maxAge: 60 * 60 * 24 * 365 * 2,
        path: "/",
        sameSite: "lax",
        httpOnly: true,
      });
      return res;
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
