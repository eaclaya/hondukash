import { toast } from "sonner"

interface ToastProps {
  title?: string
  description?: string
  variant?: "default" | "destructive"
  duration?: number
}

export const useToast = () => {
  const showToast = ({ title, description, variant = "default", duration }: ToastProps) => {
    const message = title && description ? `${title}: ${description}` : title || description || ""
    
    if (variant === "destructive") {
      toast.error(message, { duration })
    } else {
      toast.success(message, { duration })
    }
  }

  return {
    toast: showToast
  }
}