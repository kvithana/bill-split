import { Receipt } from "@/lib/types"

export function ReceiptList({ receipts }: { receipts: Receipt[] }) {
  return (
    <div>
      {receipts.map((receipt) => (
        <div key={receipt.id}>{receipt.id}</div>
      ))}
    </div>
  )
}
