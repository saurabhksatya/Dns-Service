"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-provider";
import { Button } from "@/components/ui/button";

const emptySubscribe = () => () => {};

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon-sm"
        className={`text-muted-foreground hover:text-foreground ${className ?? ""}`}
        aria-label="Toggle theme"
      >
        <span className="size-4 opacity-0" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className={`relative text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-lg transition-colors ${className ?? ""}`}
      title={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
      aria-label="Toggle theme"
    >
      {resolvedTheme === "dark" ? (
        <Sun className="size-4 text-amber-300 transition-transform rotate-0 scale-100" />
      ) : (
        <Moon className="size-4 text-slate-700 transition-transform rotate-0 scale-100" />
      )}
    </Button>
  );
}
