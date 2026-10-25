import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "ghost" | "outline" | "accent" | "danger";
  size?: "sm" | "md" | "icon";
};

export function Button({
  className,
  variant = "default",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors duration-150 outline-none disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        size === "sm" && "h-8 px-3 text-sm",
        size === "md" && "h-10 px-4 text-sm",
        size === "icon" && "h-10 w-10",
        variant === "default" &&
          "bg-muted-bg text-foreground hover:bg-border active:scale-[0.98]",
        variant === "ghost" &&
          "bg-transparent text-foreground hover:bg-muted-bg active:scale-[0.98]",
        variant === "outline" &&
          "border border-border bg-transparent text-foreground hover:bg-muted-bg",
        variant === "accent" &&
          "bg-accent text-[#041112] hover:bg-accent-strong active:scale-[0.98]",
        variant === "danger" && "bg-danger/10 text-danger hover:bg-danger/20",
        className,
      )}
      {...props}
    />
  );
}
