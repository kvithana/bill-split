import { cn } from "./utils"

export const receiptClasses = cn(
  "bg-[#fffdf8] rounded-none relative",
  "after:content-[''] after:absolute after:bottom-[-5px] after:left-0 after:right-0 after:h-[5px] after:bg-[repeating-linear-gradient(-45deg,#fffdf8_0px,#fffdf8_2px,transparent_2px,transparent_4px)]",
  "before:content-[''] before:absolute before:top-[-5px] before:left-0 before:right-0 before:h-[5px] before:bg-[repeating-linear-gradient(-45deg,#fffdf8_0px,#fffdf8_2px,transparent_2px,transparent_4px)]"
)
