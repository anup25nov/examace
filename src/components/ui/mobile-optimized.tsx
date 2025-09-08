import * as React from "react"
import { cn } from "@/lib/utils"

// Mobile-first container
export const MobileContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
      className
    )}
    {...props}
  >
    {children}
  </div>
))
MobileContainer.displayName = "MobileContainer"

// Mobile-friendly grid
export const ResponsiveGrid = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    cols?: "1" | "2" | "3" | "4"
  }
>(({ className, cols = "3", children, ...props }, ref) => {
  const gridClasses = {
    "1": "grid-cols-1",
    "2": "grid-cols-1 sm:grid-cols-2",
    "3": "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    "4": "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
  }

  return (
    <div
      ref={ref}
      className={cn(
        "grid gap-4 sm:gap-6",
        gridClasses[cols],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
ResponsiveGrid.displayName = "ResponsiveGrid"

// Mobile-friendly flex layout
export const ResponsiveFlex = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    direction?: "row" | "col"
  }
>(({ className, direction = "row", children, ...props }, ref) => {
  const flexClasses = {
    row: "flex flex-col sm:flex-row gap-4",
    col: "flex flex-col gap-4"
  }

  return (
    <div
      ref={ref}
      className={cn(
        flexClasses[direction],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
ResponsiveFlex.displayName = "ResponsiveFlex"

// Mobile-optimized text
export const ResponsiveText = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement> & {
    size?: "xs" | "sm" | "base" | "lg" | "xl"
  }
>(({ className, size = "base", children, ...props }, ref) => {
  const textClasses = {
    xs: "text-xs sm:text-sm",
    sm: "text-sm sm:text-base",
    base: "text-base sm:text-lg",
    lg: "text-lg sm:text-xl",
    xl: "text-xl sm:text-2xl lg:text-3xl"
  }

  return (
    <p
      ref={ref}
      className={cn(
        textClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </p>
  )
})
ResponsiveText.displayName = "ResponsiveText"

// Mobile-friendly heading
export const ResponsiveHeading = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement> & {
    level?: 1 | 2 | 3 | 4 | 5 | 6
    size?: "sm" | "base" | "lg" | "xl"
  }
>(({ className, level = 2, size = "base", children, ...props }, ref) => {
  const sizeClasses = {
    sm: "text-lg sm:text-xl",
    base: "text-xl sm:text-2xl",
    lg: "text-2xl sm:text-3xl lg:text-4xl",
    xl: "text-3xl sm:text-4xl lg:text-5xl"
  }

  const Component = `h${level}` as keyof JSX.IntrinsicElements

  return React.createElement(
    Component,
    {
      ref,
      className: cn(
        "font-bold text-foreground",
        sizeClasses[size],
        className
      ),
      ...props
    },
    children
  )
})
ResponsiveHeading.displayName = "ResponsiveHeading"