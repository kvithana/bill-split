import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CloudIcon } from "lucide-react"
import { motion } from "framer-motion"
import { ShareReceiptDialog } from "./share-receipt-dialog"
import { ShareLinkDialog } from "./share-link-dialog"
import { Receipt } from "@/lib/types"

interface ShareReceiptButtonProps {
  receipt: Receipt
  isOwner: boolean
  onMakeCollaborative?: () => Promise<any>
}

export function ShareReceiptButton({
  receipt,
  isOwner,
  onMakeCollaborative,
}: ShareReceiptButtonProps) {
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [isShareLinkDialogOpen, setIsShareLinkDialogOpen] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [shareInfo, setShareInfo] = useState<{ receiptId: string; shareKey: string } | null>(null)

  const handleMakeCollaborative = async () => {
    if (!onMakeCollaborative) return

    try {
      setIsSharing(true)
      const result = await onMakeCollaborative()

      if (result && result.receiptId && result.shareKey) {
        setShareInfo({
          receiptId: result.receiptId,
          shareKey: result.shareKey,
        })
        setIsShareDialogOpen(false)
        // Automatically open share link dialog
        setIsShareLinkDialogOpen(true)
      }
    } catch (error) {
      console.error("Failed to make collaborative:", error)
    } finally {
      setIsSharing(false)
    }
  }

  const handleShowShareLink = () => {
    if (receipt.shareKey && receipt.id) {
      setShareInfo({
        receiptId: receipt.id,
        shareKey: receipt.shareKey,
      })
      setIsShareLinkDialogOpen(true)
    }
  }

  // If the receipt is not shared and the user is the owner, show the share button
  if (isOwner && onMakeCollaborative && !receipt.isShared) {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="absolute right-0 top-0"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsShareDialogOpen(true)}
            className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1 p-1"
          >
            <CloudIcon className="h-3.5 w-3.5" />
            <span className="hidden md:inline">SHARE</span>
          </Button>
        </motion.div>

        <ShareReceiptDialog
          open={isShareDialogOpen}
          onOpenChange={setIsShareDialogOpen}
          onShare={handleMakeCollaborative}
          isSharing={isSharing}
        />

        {shareInfo && (
          <ShareLinkDialog
            open={isShareLinkDialogOpen}
            onOpenChange={setIsShareLinkDialogOpen}
            receiptId={shareInfo.receiptId}
            shareKey={shareInfo.shareKey}
          />
        )}
      </>
    )
  }

  // If the receipt is shared, show the shared indicator with a clickable button
  if (receipt.isShared) {
    return (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute right-0 top-0"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShowShareLink}
            className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1 p-1"
          >
            <CloudIcon className="h-3.5 w-3.5" />
            <span className="hidden md:inline">SHARED</span>
          </Button>
        </motion.div>

        {shareInfo && (
          <ShareLinkDialog
            open={isShareLinkDialogOpen}
            onOpenChange={setIsShareLinkDialogOpen}
            receiptId={shareInfo.receiptId}
            shareKey={shareInfo.shareKey}
          />
        )}
      </>
    )
  }

  // If none of the above conditions are met, don't render anything
  return null
}
