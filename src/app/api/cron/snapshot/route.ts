import { NextResponse, type NextRequest } from "next/server";
import { isMonthEnd, monthOf, snapshotMonth } from "@/lib/snapshot";

export const dynamic = "force-dynamic";

/**
 * Runs daily (see vercel.json). On the last day of each month it records every KPI's current
 * value as that month's snapshot. Vercel sends `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const now = new Date();
  const force = req.nextUrl.searchParams.get("force") === "1";
  if (!force && !isMonthEnd(now)) return NextResponse.json({ skipped: "Not month end", month: monthOf(now) });
  const count = await snapshotMonth(monthOf(now));
  return NextResponse.json({ month: monthOf(now), snapshots: count });
}
