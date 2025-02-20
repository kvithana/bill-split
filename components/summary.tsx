import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Link from "next/link"
import { Receipt } from "@/lib/types"

interface SummaryProps {
  receipt: Receipt
}

export default function Summary({ receipt }: SummaryProps) {
  const { metadata, billName, createdAt, people } = receipt

  return (
    <Link href={`/view?id=${receipt.id}`}>
      <Card className="w-full max-w-md mx-auto bg-gray-50 font-mono text-sm shadow-none rounded-none hover:shadow-md transition-shadow">
        <CardHeader className="border-b border-dashed border-gray-300 pb-2">
          <div className="flex justify-between items-center">
            <h2 className="text-sm md:text-lg font-bold uppercase">{metadata.businessName}</h2>
            <span className="text-sm md:text-lg font-bold">
              ${(metadata.totalInCents / 100).toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-gray-500">{new Date(createdAt).toLocaleDateString()}</p>
        </CardHeader>
        <CardContent className="pt-2">
          <p className="text-xs font-handwriting mb-2">{billName}</p>
          <div className="flex -space-x-2 overflow-hidden">
            {people.map((person) => (
              <Avatar
                key={person.id}
                className="inline-block h-4 w-4 md:h-6 md:w-6 rounded-full ring-2 ring-white"
              >
                <AvatarFallback>{person.name[0]}</AvatarFallback>
              </Avatar>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
