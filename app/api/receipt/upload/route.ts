import { FileUploader } from "@/lib/uploader/file-uploader";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const uploader = new FileUploader();

    const response = await uploader.upload(request);

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 } // The webhook will retry 5 times waiting for a 200
    );
  }
}
