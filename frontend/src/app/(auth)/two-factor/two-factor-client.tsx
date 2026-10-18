"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/authClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthNavbar } from "@/components/auth-navbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, ShieldCheck, KeyRound, ArrowLeft } from "lucide-react";

export default function TwoFactorClient() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [isBackupCode, setIsBackupCode] = useState(false);
  const [trustDevice, setTrustDevice] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = code.trim();

    if (!trimmed) {
      setError(isBackupCode ? "Please enter a backup code" : "Please enter your 6-digit code");
      return;
    }

    setLoading(true);

    try {
      if (isBackupCode) {
        const { error: verifyError } = await authClient.twoFactor.verifyBackupCode({
          code: trimmed,
          trustDevice,
        });

        if (verifyError) {
          setError(verifyError.message ?? "Invalid backup code");
          setLoading(false);
          return;
        }
      } else {
        const { error: verifyError } = await authClient.twoFactor.verifyTotp({
          code: trimmed,
          trustDevice,
        });

        if (verifyError) {
          setError(
            verifyError.message ??
            "Invalid verification code. Please check your authenticator app."
          );
          setLoading(false);
          return;
        }
      }

      router.push("/user/dashboard");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AuthNavbar mode="two-factor" />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="mx-auto flex w-full max-w-md flex-col items-center">
          <Card className="w-full border-border/80 bg-card shadow-xl ">
            <CardHeader className="space-y-1.5 pb-4 px-4 sm:px-6">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {isBackupCode ? (
                    <KeyRound className="h-5 w-5" />
                  ) : (
                    <ShieldCheck className="h-5 w-5" />
                  )}
                </span>
                <CardTitle className="text-2xl font-bold tracking-tight">
                  {isBackupCode ? "Backup Code" : "Two-Factor Authentication"}
                </CardTitle>
              </div>
              <CardDescription className="text-sm">
                {isBackupCode
                  ? "Enter one of your emergency recovery backup codes to sign in."
                  : "Enter the 6-digit code from your authenticator app."}
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="flex flex-col gap-4 px-4 sm:px-6">
                <div className="space-y-2">
                  <label htmlFor="code" className="text-sm font-medium">
                    {isBackupCode ? "Recovery Backup Code" : "6-Digit Authenticator Code"}
                  </label>
                  <Input
                    id="code"
                    type="text"
                    inputMode={isBackupCode ? "text" : "numeric"}
                    autoComplete="one-time-code"
                    placeholder={isBackupCode ? "e.g. a1b2c3d4e5" : "123456"}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="bg-background border-border/80 text-center text-xl tracking-[0.25em] font-mono h-12"
                    autoFocus
                    maxLength={isBackupCode ? 32 : 8}
                  />
                </div>

                {error && (
                  <p className="text-sm font-medium text-destructive">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full bg-foreground text-background hover:opacity-90 text-sm font-medium h-10 mt-1"
                  disabled={loading}
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {isBackupCode ? "Verify Backup Code" : "Verify & Sign In"}
                </Button>

                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsBackupCode(!isBackupCode);
                      setCode("");
                      setError(null);
                    }}
                    className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors cursor-pointer"
                  >
                    {isBackupCode
                      ? "Use authenticator app code instead"
                      : "Lost your device? Use a backup code"}
                  </button>
                </div>
              </CardContent>

              <CardFooter className="flex justify-center border-t border-border/60 pt-4 mt-6">
                <Link
                  href="/signin"
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Return to sign in
                </Link>
              </CardFooter>
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
}
