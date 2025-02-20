"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useReceiptStore } from "@/data/state"
import { useAnalyseReceipt } from "@/hooks/use-analyse-receipt"
import { useIp } from "@/hooks/use-ip"
import { ipHash } from "@/lib/ip-hash"
import { upload } from "@vercel/blob/client"
import { AnimatePresence, motion } from "framer-motion"
import { CheckCircle, Loader2, Upload } from "lucide-react"
import { useRef, useState } from "react"

type ImportState = "initial" | "uploading" | "analyzing" | "done"

export default function ReceiptImport({ onDone }: { onDone: (id: string) => void }) {
  const [importState, setImportState] = useState<ImportState>("initial")
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { data } = useIp()
  const [analyse, { data: receipt }] = useAnalyseReceipt()
  const addReceipt = useReceiptStore((state) => state.addReceipt)

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setImportState("uploading")
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      const ip = data?.ip

      if (!ip) {
        throw new Error("No IP address found")
      }

      const path = [ipHash(ip), file.name].join("/")

      const newBlob = await upload(path, file, {
        access: "public",
        handleUploadUrl: "/api/receipt/upload",
      })

      setImportState("analyzing")

      const response = await analyse(newBlob.url)

      if (!response?.success || !response?.receipt) {
        throw new Error("Failed to analyse receipt")
      }

      if (response?.receipt && addReceipt) {
        addReceipt(response.receipt)
      }

      setImportState("done")
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-[#fffdf8] font-mono text-sm overflow-hidden">
      <CardHeader className="text-center border-b border-dashed border-gray-300">
        <h2 className="text-lg font-bold uppercase">Import Receipt</h2>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <AnimatePresence mode="wait">
          {importState === "initial" && (
            <motion.div
              key="initial"
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-300 rounded-lg"
            >
              <Upload className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-sm text-gray-500 mb-2">Click to upload or drag and drop</p>
              <Input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                ref={fileInputRef}
              />
              <Button onClick={() => fileInputRef.current?.click()}>Select Image</Button>
            </motion.div>
          )}
          {importState === "uploading" && (
            <motion.div
              key="uploading"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center h-64"
            >
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
              <p className="text-sm text-gray-500">Uploading receipt...</p>
            </motion.div>
          )}
          {importState === "analyzing" && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="relative h-64"
            >
              {previewImage && (
                <img
                  src={previewImage || "/placeholder.svg"}
                  alt="Receipt preview"
                  className="w-full h-full object-cover rounded-lg"
                />
              )}
              <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center rounded-lg">
                <motion.div
                  className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                />
                <p className="text-white mt-4">Analyzing receipt...</p>
                <motion.div
                  className="mt-2 flex space-x-2"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: [0.8, 1.2, 0.8] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                >
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 bg-white rounded-full"
                      initial={{ opacity: 0.3 }}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{
                        duration: 1.5,
                        delay: i * 0.2,
                        repeat: Number.POSITIVE_INFINITY,
                      }}
                    />
                  ))}
                </motion.div>
              </div>
            </motion.div>
          )}
          {importState === "done" && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center h-64"
            >
              <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
              <p className="text-lg font-semibold text-green-500 mb-2">Analysis Complete!</p>
              <Button onClick={() => receipt && onDone(receipt.id)}>View Receipt</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
