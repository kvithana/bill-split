"use client"

import { useState, useEffect } from "react"
import { useReceiptStore, type ReceiptStore } from "@/data/state"

const useStore = <F>(callback: (state: ReceiptStore) => F) => {
  const result = useReceiptStore(callback) as F
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState<F>()

  useEffect(() => {
    setData(result)
    console.log("result", result)
    setIsLoading(false)
  }, [result])

  return [data, { isLoading }] as const
}

export default useStore
