"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { useReceiptStore } from "@/data/state"
import { useAnalyseReceipt } from "@/hooks/use-analyse-receipt"
import { getIp } from "@/hooks/use-ip"
import { ipHash } from "@/lib/ip-hash"
import { upload } from "@vercel/blob/client"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowLeft, Camera, CheckCircle, Upload, X } from "lucide-react"
import { useState, useCallback, useRef } from "react"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useDropzone } from "react-dropzone"

type ImportState = "initial" | "uploading" | "analyzing" | "done" | "error"

export default function ReceiptImport({ onDone }: { onDone: (id: string) => void }) {
  const [importState, setImportState] = useState<ImportState>("initial")
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const router = useRouter()
  const [analyse] = useAnalyseReceipt()
  const addReceipt = useReceiptStore((state) => state.addReceipt)
  const [success, setSuccess] = useState(false)

  const handleFile = async (file: File) => {
    try {
      if (success) return
      setImportState("uploading")
      const reader = new FileReader()
      reader.onload = (e) => setPreviewImage(e.target?.result as string)
      reader.readAsDataURL(file)

      const ip = await getIp()

      if (!ip) throw new Error("No IP address found")

      const path = [ipHash(ip), file.name].join("/")
      const newBlob = await upload(path, file, {
        access: "public",
        handleUploadUrl: "/api/receipt/upload",
      })

      setImportState("analyzing")
      const response = await analyse(newBlob.url)

      if (!response?.success || !response?.receipt) {
        throw new Error(response?.error ?? "Failed to analyze receipt")
      }

      if (response?.receipt && addReceipt) {
        addReceipt(response.receipt)
        setImportState("done")
        setTimeout(() => onDone(response.receipt!.id), 1500)
        setSuccess(true)
      }
    } catch (error) {
      setImportState("error")
      toast({
        title: "Error processing receipt",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      })
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) handleFile(file)
  }, [])

  const {
    getRootProps,
    getInputProps,
    open: openDefault,
    isDragActive,
  } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".heic"],
    },
    maxFiles: 1,
    multiple: false,
    noClick: true,
  })

  const { getInputProps: getCameraInputProps, open: openCamera } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".heic"],
    },
    maxFiles: 1,
    multiple: false,
    noClick: true,
    noDrag: true,
  })

  const openFilePicker = (useCamera: boolean) => (e: React.MouseEvent) => {
    e.stopPropagation()
    useCamera ? openCamera() : openDefault()
  }

  return (
    <div className="relative w-full max-w-xl mx-auto px-4 -mt-16">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/")}
        className="absolute -top-16 left-4 font-mono text-gray-500 hover:text-gray-800"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back
      </Button>

      <AnimatePresence mode="wait">
        {importState === "initial" && (
          <motion.div
            key="initial"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`flex w-full h-full min-h-[500px] border-2 border-dashed rounded-lg relative group transition-colors ${
              isDragActive ? "border-gray-400 bg-gray-50/80" : "border-gray-200 bg-gray-50/50"
            }`}
          >
            <div
              {...getRootProps()}
              className="w-full h-full flex flex-col items-center justify-center"
            >
              <input {...getInputProps()} />
              <input {...getCameraInputProps()} />
              <Upload
                className={`w-16 h-16 mb-6 transition-transform ${
                  isDragActive ? "text-gray-400 scale-110" : "text-gray-300 group-hover:scale-110"
                }`}
              />
              <p className="text-sm text-gray-500 font-mono text-center">
                {isDragActive ? "Drop it! Yum yum." : "Lemme see that receipt"}
              </p>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={openFilePicker(true)}
                  className="font-mono"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Camera
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={openFilePicker(false)}
                  className="font-mono"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Browse
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {(importState === "uploading" || importState === "analyzing") && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative min-h-[500px] rounded-lg overflow-hidden"
          >
            {previewImage && (
              <motion.img
                src={previewImage}
                alt="Receipt preview"
                className="w-full h-full object-contain absolute inset-0"
                initial={{ scale: 1.1, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              />
            )}
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center">
              <div className="h-16 w-16 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
              <p className="text-sm text-gray-600 font-mono mt-6">
                {importState === "uploading" ? "Uploading" : "Processing"}
              </p>
              <div className="flex space-x-2 mt-2">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, delay: i * 0.2, repeat: Infinity }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {importState === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="flex flex-col items-center justify-center min-h-[500px] rounded-lg bg-green-50"
          >
            <CheckCircle className="w-16 h-16 text-green-600 mb-6" />
            <p className="text-green-600 font-mono">Receipt processed successfully!</p>
          </motion.div>
        )}

        {importState === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center min-h-[500px] rounded-lg bg-red-50"
          >
            <X className="w-16 h-16 text-red-600 mb-6" />
            <p className="text-red-600 font-mono mb-4">Failed to read receipt</p>
            <Button
              variant="outline"
              onClick={() => setImportState("initial")}
              className="font-mono"
            >
              Try Again
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
