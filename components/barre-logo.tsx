"use client";

import { cn } from "@/lib/utils";

type BarreLogoProps = {
  collapsed?: boolean;
  className?: string;
  markOnly?: boolean;
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-11 w-11",
} as const;

export function BarreWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("tracking-tight", className)}>
      Barre <span className="text-accent">AI</span>
    </span>
  );
}

/** Cropped Barre “B” mark — transparent background */
export function BarreIcon({
  size = "md",
  className,
  rounded = "rounded-xl",
}: {
  size?: keyof typeof sizes;
  className?: string;
  rounded?: string;
}) {
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden",
        rounded,
        sizes[size],
        className,
      )}
    >
      <img
        src="/barre-icon.png"
        alt="Barre AI"
        width={88}
        height={88}
        className="h-full w-full object-contain"
        draggable={false}
      />
    </div>
  );
}

export function BarreLogo({
  collapsed = false,
  className,
  markOnly = false,
  size = "md",
}: BarreLogoProps) {
  if (markOnly || collapsed) {
    return (
      <BarreIcon
        size={size}
        rounded={markOnly ? "rounded-full" : "rounded-xl"}
        className={className}
      />
    );
  }

  return (
    <div className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <BarreIcon size={size} />
      <div className="min-w-0 leading-tight">
        <p className="truncate text-[15px] font-semibold text-foreground">
          <BarreWordmark />
        </p>
        <p className="mt-1 truncate text-[11px] text-muted">
          Creative intelligence
        </p>
      </div>
    </div>
  );
}
