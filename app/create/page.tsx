"use client";

import { useAnalyseReceipt } from "@/hooks/use-analyse-receipt";
import { useIp } from "@/hooks/use-ip";
import { ipHash } from "@/lib/ip-hash";
import { type PutBlobResult } from "@vercel/blob";
import { upload } from "@vercel/blob/client";
import { useState, useRef } from "react";

export default function CreatePage() {
  const inputFileRef = useRef<HTMLInputElement>(null);
  const [blob, setBlob] = useState<PutBlobResult | null>(null);
  const { data } = useIp();
  const [analyse, { data: receipt, error, isLoading }] = useAnalyseReceipt();
  return (
    <>
      <h1>Upload Your Receipt</h1>

      <form
        onSubmit={async (event) => {
          event.preventDefault();

          if (!inputFileRef.current?.files) {
            throw new Error("No file selected");
          }

          const file = inputFileRef.current.files[0];

          const ip = data?.ip;

          if (!ip) {
            throw new Error("No IP address found");
          }

          const path = [ipHash(ip), file.name].join("/");

          const newBlob = await upload(path, file, {
            access: "public",
            handleUploadUrl: "/api/receipt/upload",
          });

          setBlob(newBlob);
        }}
      >
        <input name="file" ref={inputFileRef} type="file" required />
        <button type="submit">Upload</button>
      </form>
      {blob && (
        <div>
          Blob url: <a href={blob.url}>{blob.url}</a>
          <button onClick={() => analyse(blob.url)}>Analyse</button>
          {receipt && <pre>{JSON.stringify(receipt, null, 2)}</pre>}
        </div>
      )}
    </>
  );
}
