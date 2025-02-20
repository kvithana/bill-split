import type { Receipt } from "@/lib/types";
import { useState } from "react";

export function useAnalyseReceipt() {
  const [error, setError] = useState<{ error: string; status: number } | null>(null);
  const [data, setData] = useState<Receipt | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function analyse(path: string): Promise<Receipt | null> {
    try {
      setIsLoading(true);
      const response = await fetch("/api/receipt/analyse", {
        method: "POST",
        body: JSON.stringify({ path }),
      });

      if (!response.ok) {
        setError({ error: response.statusText, status: response.status });
        return null;
      }

      const data = await response.json();
      setData(data);
      return data as Receipt;
    } catch (error: any) {
      setError({
        error: "message" in error ? error.message : "Unknown error",
        status: 500,
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }

  return [analyse, { data, error, isLoading }] as const;
}
