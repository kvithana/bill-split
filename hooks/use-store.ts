"use client"

import { useState, useEffect } from "react"
import { useReceiptStore, type ReceiptStore } from "@/data/state"

const useStore = <F>(callback: (state: ReceiptStore) => F) => {
  const result = useReceiptStore(callback) as F
  const [data, setData] = useState<F>()

  useEffect(() => {
    setData(result)
  }, [result])

  return data
}

export default useStore
