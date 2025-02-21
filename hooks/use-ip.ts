import useSWR from "swr"

export const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function useIp() {
  return useSWR<{ ip: string }>("/api/ip", fetcher)
}

export async function getIp() {
  try {
    const response = await fetch("/api/ip")
    const data = await response.json()
    return data.ip
  } catch (error) {
    console.error("Error fetching IP", error)
    return null
  }
}
