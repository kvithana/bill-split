import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

interface Person {
  id: number
  name: string
  avatar: string
}

interface LineItem {
  id: number
  name: string
  quantity: number
  total: number
  splitBetween: Person[]
}

interface BillProps {
  businessName: string
  date: string
  items: LineItem[]
  total: number
}

export default function RestaurantBill({ businessName, date, items, total }: BillProps) {
  return (
    <Card className="w-full max-w-md mx-auto bg-[#fffdf8] font-mono text-sm">
      <CardHeader className="text-center border-b border-dashed border-gray-300">
        <h2 className="text-lg font-bold uppercase">{businessName}</h2>
        <p className="text-xs text-gray-500">{date}</p>
      </CardHeader>
      <CardContent className="p-4 space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between items-center">
            <div className="flex-1">
              <span className="font-bold">{item.name}</span>
              <span className="text-gray-500 ml-2">x{item.quantity}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>${item.total.toFixed(2)}</span>
              <div className="flex -space-x-1">
                {item.splitBetween.map((person) => (
                  <Avatar key={person.id} className="w-6 h-6 border-2 border-white">
                    <AvatarImage src={person.avatar} alt={person.name} />
                    <AvatarFallback>{person.name[0]}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
      <CardFooter className="flex justify-between items-center border-t border-dashed border-gray-300 p-4">
        <span className="font-bold">Total</span>
        <span className="font-bold text-lg">${total.toFixed(2)}</span>
      </CardFooter>
    </Card>
  )
}
