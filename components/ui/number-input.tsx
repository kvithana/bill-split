import React, { ChangeEvent } from "react"
import { Input } from "./input"

interface NumberInputProps extends Omit<React.ComponentProps<typeof Input>, "onChange" | "value"> {
  value: string
  onChange: (value: number) => void
  allowNegative?: boolean
  className?: string
}

export function NumberInput({ value, onChange, allowNegative = true, ...props }: NumberInputProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value

    // Allow empty string, minus sign, and valid numbers
    if (newValue === "" || (allowNegative && newValue === "-") || /^-?\d*\.?\d*$/.test(newValue)) {
      // Only call onChange with number when we have a valid number
      if (newValue === "" || newValue === "-") {
        onChange(0)
      } else {
        onChange(Number(newValue))
      }
    }
  }

  const handleBlur = () => {
    if (value === "" || value === "-") {
      onChange(0)
    }
  }

  return (
    <Input
      {...props}
      type="text"
      inputMode="numeric"
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  )
}
