"use client";

import { useEffect, useState } from "react";
import { IconLightMode, IconMoon } from "@/components/icons";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  className?: string;
  iconClassName?: string;
};

/**
 * Renders a stable placeholder until mount to avoid hydration mismatches
 * when localStorage theme differs from the server default.
 */
export function ThemeToggle({
  className,
  iconClassName = "h-5 w-5",
}: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "h-10 w-10 rounded-xl text-muted hover:bg-muted-bg hover:text-accent",
        className,
      )}
      onClick={toggleTheme}
      aria-label={
        !mounted
          ? "Toggle theme"
          : theme === "dark"
            ? "Switch to light mode"
            : "Switch to dark mode"
      }
      title={
        !mounted ? "Theme" : theme === "dark" ? "Light mode" : "Dark mode"
      }
    >
      {!mounted ? (
        <span className={cn("block", iconClassName)} aria-hidden />
      ) : theme === "dark" ? (
        <IconLightMode className={iconClassName} />
      ) : (
        <IconMoon className={iconClassName} />
      )}
    </Button>
  );
}
