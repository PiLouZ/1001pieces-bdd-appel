
import { useTheme } from "next-themes"
import { Toaster as Sonner, toast as sonnerToast } from "sonner"
import { Progress } from "@/components/ui/progress"
import { useState, useEffect } from "react"

type ToasterProps = React.ComponentProps<typeof Sonner>

// Progress component for toast timer
const ToastProgress = ({ duration = 5000 }) => {
  const [progress, setProgress] = useState(0)
  
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          clearInterval(interval)
          return 100
        }
        return prevProgress + (100 / (duration / 100))
      })
    }, 100)
    
    return () => clearInterval(interval)
  }, [duration])
  
  return <Progress value={progress} className="h-1 mt-1" />
}

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      duration={5000} // Auto-dismiss after 5 seconds
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props as any}
    />
  )
}

// Enhanced toast with progress bar
const toastWithProgress = (message: string | React.ReactNode, options?: any) => {
  return sonnerToast(message, {
    duration: 5000,
    ...options,
    footer: () => <ToastProgress duration={5000} />,
  })
}

export { Toaster, sonnerToast as toast, toastWithProgress }
