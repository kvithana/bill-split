import useSWR from "swr";

export const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useIp() {
  return useSWR<{ ip: string }>("/api/ip", fetcher);
}
