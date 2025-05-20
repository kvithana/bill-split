import { CloudReceiptStorage } from "@/lib/receipt/cloud-storage"
import { Metadata } from "next"
import { SplitReceiptPage as Page } from "./client-page"
import { format } from "date-fns"

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  // Fetch the receipt data for metadata
  const receipt = await CloudReceiptStorage.getReceipt(params.id)

  if (!receipt) {
    return {
      title: "Receipt Not Found | Split // IT",
      description: "The shared receipt you're looking for doesn't exist or has expired.",
    }
  }

  const businessName = receipt.metadata.businessName || "Receipt"
  const totalAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(receipt.metadata.totalInCents / 100)

  const date = new Date(receipt.metadata.dateAsISOString || receipt.createdAt)

  const formattedDate = format(date, "dd/MM/yyyy")

  return {
    title: `${businessName} on ${formattedDate} | Split // It`,
    description: `Split a ${totalAmount} bill from ${businessName} on ${formattedDate}. Easily manage who pays for what with Split // IT.`,
    openGraph: {
      title: `${businessName} on ${formattedDate} | Split // It`,
      description: `Split a ${totalAmount} bill from ${businessName} on ${formattedDate}. Easily manage who pays for what.`,
      type: "website",
      images: [
        {
          url: "/og_image.png",
          width: 1200,
          height: 630,
          alt: "Split // IT: Split bills with friends. No fuss.",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${businessName} Receipt | Split // IT`,
      description: `Split a ${totalAmount} bill from ${businessName} with your friends. Easily manage who pays for what.`,
      images: ["/og_image.png"],
    },
  }
}

export default function SplitReceiptPage() {
  return <Page />
}
