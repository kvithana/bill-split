import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase/client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/cron/keep-alive
 *
 * Called daily by Vercel Cron to prevent the Supabase free-tier instance
 * from being paused due to inactivity.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { count, error } = await supabase
    .from("receipts")
    .select("*", { count: "exact", head: true })

  if (error) {
    console.error("[cron/keep-alive] Supabase ping failed:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log(`[cron/keep-alive] ok — receipts count: ${count}`)
  return NextResponse.json({ ok: true, count })
}
