import { ReceiptReader } from "@/lib/ocr/receipt-reader";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function POST(request: Request) {
  const body = await request.json();

  const ip = request.headers.get("x-forwarded-for");

  if (!ip) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const schema = z.object({
    path: z.string(),
  });

  const { data, error } = schema.safeParse(body);

  if (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { path } = data;

  const reader = ReceiptReader.create();

  const receipt = await reader.readReceipt(path);

  return NextResponse.json(receipt);
}
