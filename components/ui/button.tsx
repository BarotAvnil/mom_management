import * as React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
    size?: "default" | "sm" | "lg" | "icon"
    isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "default", size = "default", isLoading, children, disabled, ...props }, ref) => {

        const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]"

        const variants = {
            default: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-500/10",
            destructive: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
            outline: "border border-border bg-white/60 backdrop-blur-sm hover:bg-white/80 hover:text-foreground text-foreground",
            secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
            ghost: "hover:bg-white/50 hover:text-foreground",
            link: "text-indigo-600 underline-offset-4 hover:underline",
        }

        const sizes = {
            default: "h-10 px-5 py-2",
            sm: "h-9 rounded-lg px-3.5",
            lg: "h-11 rounded-xl px-8",
            icon: "h-10 w-10",
        }

        const Comp = "button"

        return (
            <Comp
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                ref={ref}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {children}
            </Comp>
        )
    }
)
Button.displayName = "Button"

export { Button }
