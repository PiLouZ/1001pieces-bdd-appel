
import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check, Minus } from "lucide-react"

import { cn } from "@/lib/utils"

export interface CheckboxProps extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  indeterminate?: boolean;
}

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, indeterminate, checked, ...props }, ref) => {
  const checkboxRef = React.useRef<React.ElementRef<typeof CheckboxPrimitive.Root>>(null);
  
  React.useEffect(() => {
    if (checkboxRef.current) {
      if (typeof indeterminate === 'boolean') {
        // Apply the indeterminate state visually
        // We handle this in the indicator
      }
    }
  }, [indeterminate]);
  
  return (
    <CheckboxPrimitive.Root
      ref={(node) => {
        // Merge the refs
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
        checkboxRef.current = node;
      }}
      className={cn(
        "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
        className
      )}
      checked={checked}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className={cn("flex items-center justify-center text-current")}
      >
        {indeterminate ? (
          <Minus className="h-4 w-4" />
        ) : (
          <Check className="h-4 w-4" />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
})
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
