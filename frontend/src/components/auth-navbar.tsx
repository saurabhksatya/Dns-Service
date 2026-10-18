"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Globe2, LogOut, ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { authClient } from "@/lib/authClient";

interface AuthNavbarProps {
  mode?: "signin" | "signup" | "two-factor" | "setup";
}

export function AuthNavbar({ mode }: AuthNavbarProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/signin");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background font-bold text-sm tracking-tight transition-transform group-hover:scale-105">
            <Globe2 className="h-4 w-4" />
          </span>
          <span className="text-base font-semibold tracking-tight">
            Route<span className="text-muted-foreground font-normal">DNS</span>
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {mode === "signin" && (
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <span>Don&apos;t have an account?</span>
              <Link
                href="/signup"
                className="font-medium text-foreground hover:underline underline-offset-4"
              >
                Sign up
              </Link>
            </div>
          )}

          {mode === "signup" && (
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <span>Already have an account?</span>
              <Link
                href="/signin"
                className="font-medium text-foreground hover:underline underline-offset-4"
              >
                Sign in
              </Link>
            </div>
          )}

          {mode === "two-factor" && (
            <Link
              href="/signin"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to sign in</span>
            </Link>
          )}

          {mode === "setup" && (
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </button>
          )}

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
