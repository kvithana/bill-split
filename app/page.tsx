"use client"

import { CreateCard } from "@/components/create-card"
import { ReceiptListLoader } from "@/components/receipt-list-loader"
import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { InstallPrompt } from "@/components/install-prompt"

export default function Home() {
  const [isExiting, setIsExiting] = useState(false)
  const [hasSeenIntro, setHasSeenIntro] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const hasSeenIntro = sessionStorage.getItem("hasSeenIntro")
    setHasSeenIntro(!!hasSeenIntro)
    if (!hasSeenIntro) {
      sessionStorage.setItem("hasSeenIntro", "true")
    }
  }, [])

  const handleCreate = () => {
    setIsExiting(true)
    setTimeout(() => {
      router.push("/create")
    }, 500)
  }

  const handleReceiptClick = (id: string) => {
    setIsExiting(true)
    setTimeout(() => {
      router.push(`/view?id=${id}`)
    }, 500)
  }

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-col items-center min-h-screen p-6 md:pb-20 gap-8 font-[family-name:var(--font-geist-sans)]"
        >
          <motion.header
            initial={{ opacity: 0, y: hasSeenIntro ? 0 : -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: hasSeenIntro ? 0.3 : 0.8, delay: hasSeenIntro ? 0 : 0.2 }}
            className="w-full max-w-md mx-auto text-center space-y-4 pt-8"
          >
            <h1 className="font-mono text-2xl md:text-3xl font-bold tracking-tight">
              Split <span className="opacity-40">{"//"}</span> it
            </h1>
            <p className="text-sm text-gray-600 font-mono">Split bills with friends. No fuss.</p>
            <p className="text-xs text-gray-400 font-mono">by Kalana Vithana</p>
          </motion.header>
          <motion.main
            initial={{ opacity: 0, y: hasSeenIntro ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: hasSeenIntro ? 0.3 : 0.8, delay: hasSeenIntro ? 0 : 0.4 }}
            className="flex flex-col gap-4 w-full flex-1"
          >
            <div className="flex flex-col gap-4 w-full">
              <CreateCard onCreate={handleCreate} />
              <ReceiptListLoader onReceiptClick={handleReceiptClick} />
            </div>
          </motion.main>
          <footer className="flex flex-col gap-6 flex-wrap items-center justify-center mt-auto">
            <InstallPrompt />
            <p className="text-xs text-gray-400 font-mono">Build {process.env.COMMIT_HASH}</p>
          </footer>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
