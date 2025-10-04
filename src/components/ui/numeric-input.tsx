import * as React from "react"
import { cn } from "@/lib/utils"

export interface NumericInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  allowDecimals?: boolean
  allowNegative?: boolean
  maxDecimals?: number
  onChange?: (value: string) => void
  onValueChange?: (value: number | undefined) => void
}

const NumericInput = React.forwardRef<HTMLInputElement, NumericInputProps>(
  ({ 
    className, 
    allowDecimals = true, 
    allowNegative = false, 
    maxDecimals = 4,
    onChange,
    onValueChange,
    onKeyPress,
    ...props 
  }, ref) => {
    
    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
      const char = e.key
      const currentValue = (e.target as HTMLInputElement).value
      const selectionStart = (e.target as HTMLInputElement).selectionStart || 0
      const selectionEnd = (e.target as HTMLInputElement).selectionEnd || 0
      
      // Allow control keys (backspace, delete, arrow keys, tab, etc.)
      if (
        char === 'Backspace' ||
        char === 'Delete' ||
        char === 'Tab' ||
        char === 'ArrowLeft' ||
        char === 'ArrowRight' ||
        char === 'ArrowUp' ||
        char === 'ArrowDown' ||
        char === 'Home' ||
        char === 'End' ||
        (char === 'a' && e.ctrlKey) ||
        (char === 'c' && e.ctrlKey) ||
        (char === 'v' && e.ctrlKey) ||
        (char === 'x' && e.ctrlKey) ||
        (char === 'z' && e.ctrlKey)
      ) {
        if (onKeyPress) onKeyPress(e)
        return
      }

      // Allow digits
      if (/[0-9]/.test(char)) {
        if (onKeyPress) onKeyPress(e)
        return
      }

      // Allow negative sign only at the beginning
      if (allowNegative && char === '-' && selectionStart === 0 && !currentValue.includes('-')) {
        if (onKeyPress) onKeyPress(e)
        return
      }

      // Allow decimal point
      if (allowDecimals && char === '.') {
        // Only allow one decimal point
        if (currentValue.includes('.')) {
          e.preventDefault()
          return
        }
        
        // Check if adding decimal would exceed max decimals
        const beforeSelection = currentValue.substring(0, selectionStart)
        const afterSelection = currentValue.substring(selectionEnd)
        const newValue = beforeSelection + char + afterSelection
        
        if (onKeyPress) onKeyPress(e)
        return
      }

      // Block all other characters
      e.preventDefault()
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value
      
      // Validate decimal places
      if (allowDecimals && value.includes('.')) {
        const parts = value.split('.')
        if (parts[1] && parts[1].length > maxDecimals) {
          value = parts[0] + '.' + parts[1].substring(0, maxDecimals)
          e.target.value = value
        }
      }

      // Call the original onChange if provided
      if (onChange) {
        onChange(value)
      }

      // Call onValueChange with parsed number
      if (onValueChange) {
        const numericValue = value === '' ? undefined : parseFloat(value)
        onValueChange(isNaN(numericValue!) ? undefined : numericValue)
      }
    }

    return (
      <input
        type="text"
        inputMode="decimal"
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        onKeyPress={handleKeyPress}
        onChange={handleChange}
        {...props}
      />
    )
  }
)
NumericInput.displayName = "NumericInput"

export { NumericInput }