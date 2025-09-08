import * as React from "react"
import { cn } from "@/lib/utils"

const ResponsiveCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      "transition-all duration-300 hover:shadow-lg hover:scale-[1.02]",
      "overflow-hidden",
      className
    )}
    {...props}
  >
    {children}
  </div>
))
ResponsiveCard.displayName = "ResponsiveCard"

const ResponsiveCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn("p-4 sm:p-6", className)} 
    {...props} 
  />
))
ResponsiveCardContent.displayName = "ResponsiveCardContent"

export { ResponsiveCard, ResponsiveCardContent }