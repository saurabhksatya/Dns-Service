"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "react-qr-code";
import { authClient } from "@/lib/authClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthNavbar } from "@/components/auth-navbar";
import { Card } from "@/components/ui/card";
import {
  Loader2,
  ShieldCheck,
  Copy,
  Check,
  Download,
  CheckCircle2,
} from "lucide-react";

export default function SetupClient({ userEmail }: { userEmail: string }) {
  const router = useRouter();

  const [totpURI, setTotpURI] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState("");
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [initLoading, setInitLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const initTotp = useCallback(
    async (activePwd: string) => {
      setError(null);
      setInitLoading(true);

      try {
        const res = await authClient.twoFactor.enable({
          password: activePwd,
        });

        if (res.error) {
          // If TOTP is already initiated, fetch current URI
          const uriRes = await authClient.twoFactor.getTotpUri({
            password: activePwd,
          });
          if (uriRes.data?.totpURI) {
            setTotpURI(uriRes.data.totpURI);
            const backupRes = await authClient.twoFactor.generateBackupCodes({
              password: activePwd,
            });
            if (backupRes.data?.backupCodes) {
              setBackupCodes(backupRes.data.backupCodes);
            }
            setInitLoading(false);
            return;
          }

          setError(
            res.error.message ??
              "Failed to initialize 2FA. Please verify your password.",
          );
          setInitLoading(false);
          return;
        }

        if (res.data) {
          setTotpURI(res.data.totpURI);
          setBackupCodes(res.data.backupCodes ?? []);
        }
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Failed to initialize 2FA setup",
        );
      } finally {
        setInitLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    let ignore = false;
    const savedPwd = sessionStorage.getItem("totp_setup_pwd");
    if (!savedPwd) {
      router.replace("/signin");
      return;
    }

    const timer = setTimeout(() => {
      if (!ignore) void initTotp(savedPwd);
    }, 0);
    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [initTotp, router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = verificationCode.trim();
    if (!trimmed) {
      setError("Please enter the 6-digit code from your authenticator app.");
      return;
    }

    setError(null);
    setVerifyLoading(true);

    try {
      const { error: verifyError } = await authClient.twoFactor.verifyTotp({
        code: trimmed,
        trustDevice: false,
      });

      if (verifyError) {
        setError(
          verifyError.message ??
            "Invalid code. Please check your authenticator app.",
        );
        setVerifyLoading(false);
        return;
      }

      sessionStorage.removeItem("totp_setup_pwd");
      setSuccess(true);
      setTimeout(() => {
        router.push("/user/dashboard");
        router.refresh();
      }, 1000);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Verification failed. Please try again.",
      );
      setVerifyLoading(false);
    }
  };

  const extractSecret = (uri: string) => {
    try {
      const url = new URL(uri);
      return url.searchParams.get("secret") ?? uri;
    } catch {
      return uri;
    }
  };

  const handleCopyKey = () => {
    if (!totpURI) return;
    const secret = extractSecret(totpURI);
    navigator.clipboard.writeText(secret);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopyCodes = () => {
    if (!backupCodes.length) return;
    navigator.clipboard.writeText(backupCodes.join("\n"));
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  const handleDownloadCodes = () => {
    if (!backupCodes.length) return;
    const blob = new Blob(
      [
        `RouteDNS 2FA Backup Recovery Codes\nAccount: ${userEmail}\nGenerated: ${new Date().toISOString()}\n\n` +
          backupCodes.map((c, i) => `${i + 1}. ${c}`).join("\n") +
          "\n\nEach code can be used once to sign in if you lose access to your authenticator app.",
      ],
      { type: "text/plain" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `routedns-backup-codes-${userEmail.replace(/[^a-zA-Z0-9]/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <AuthNavbar mode="setup" />

      <main className="mx-auto flex min-h-0 w-full max-w-none flex-1 items-stretch px-2 py-2 sm:px-3 sm:py-3 lg:px-4 lg:py-4">
        {success ? (
          <Card className="w-full max-w-md border-border/80 bg-card p-6 text-center shadow-xl sm:p-8">
            <div className="flex flex-col items-center justify-center gap-4 py-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">
                Two-Factor Authentication Enabled!
              </h2>
              <p className="max-w-xs text-sm text-muted-foreground">
                Your account is now fully secured with TOTP. Redirecting to
                your dashboard...
              </p>
              <Loader2 className="mt-2 h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          </Card>
        ) : (
          <Card className="min-h-0 w-full flex-1 border-border/80 bg-card p-4 shadow-xl sm:p-5 lg:p-6">
            <div className="flex min-h-0 flex-1 flex-col gap-3">
              <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border/70 pb-3">
                <div>
                  <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                    Set Up Two-Factor Authentication
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Secure your RouteDNS account with an authenticator app.
                  </p>
                </div>
                {initLoading && (
                  <Loader2
                    className="h-5 w-5 shrink-0 animate-spin text-muted-foreground"
                    aria-label="Preparing setup"
                  />
                )}
              </header>

              {error && (
                <div className="flex shrink-0 flex-wrap items-center justify-between gap-2" role="alert">
                  <p className="text-sm font-medium text-destructive">{error}</p>
                  {!totpURI && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => router.push("/signin")}
                    >
                      Return to sign in
                    </Button>
                  )}
                </div>
              )}

              <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 overflow-y-auto lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-0">
                <section className="flex min-h-97.5 flex-col gap-3 lg:min-h-0 lg:border-r lg:border-border/70 lg:pr-5">
                  <div className="shrink-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        1
                      </span>
                      <h2 className="text-lg font-semibold tracking-tight">
                        Scan authenticator QR code
                      </h2>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Scan with your authenticator app, or copy the setup key.
                    </p>
                  </div>

                  <div className="mx-auto flex aspect-square w-[min(400px,50svh,42vw)] shrink-0 items-center justify-center rounded-xl border border-border/60 bg-white p-4">
                    {totpURI ? (
                      <QRCode value={totpURI} size={256} className="h-full w-full" />
                    ) : (
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    )}
                  </div>

                  <div className="space-y-2 border-t border-border/60 pt-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        Manual setup key
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyKey}
                        disabled={!totpURI}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline disabled:opacity-50"
                      >
                        {copiedKey ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                            <span className="text-emerald-500">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy key</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="break-all rounded-lg border border-border/70 bg-muted/40 px-3 py-2 text-center font-mono text-xs tracking-wider select-all">
                      {totpURI ? extractSecret(totpURI) : "Preparing setup key..."}
                    </div>
                  </div>
                </section>

                <div className="flex min-h-87.5 flex-col gap-5 lg:min-h-0 lg:pl-5">
                  <section className="flex flex-col gap-2 lg:min-h-0 lg:flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/10 text-xs font-bold text-amber-600">
                          2
                        </span>
                        <h2 className="text-lg font-semibold tracking-tight">
                          Save backup codes
                        </h2>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleCopyCodes}
                          disabled={!backupCodes.length}
                          className="inline-flex items-center gap-1.5 rounded-md border border-border/80 px-2 py-1 text-xs font-medium hover:bg-muted disabled:opacity-50"
                        >
                          {copiedCodes ? (
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                          <span>{copiedCodes ? "Copied" : "Copy"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleDownloadCodes}
                          disabled={!backupCodes.length}
                          className="inline-flex items-center gap-1.5 rounded-md border border-border/80 px-2 py-1 text-xs font-medium hover:bg-muted disabled:opacity-50"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Download</span>
                        </button>
                      </div>
                    </div>
                    <p className="shrink-0 text-sm text-muted-foreground">
                      Keep these codes somewhere secure. Each one works once.
                    </p>
                    {backupCodes.length ? (
                      <div className="grid grid-cols-2 gap-2 overflow-y-auto rounded-lg border border-border/70 bg-muted/30 p-3 font-mono text-sm text-center lg:min-h-0 lg:flex-1 lg:auto-rows-fr">
                        {backupCodes.map((code, index) => (
                          <div
                            key={index}
                            className="break-all rounded-md border border-border/40 bg-background/90 px-2 py-2 font-medium select-all"
                          >
                            {code}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground" role="status">
                        {initLoading ? "Generating backup codes..." : "Backup codes will appear here."}
                      </p>
                    )}
                  </section>

                  <section className="border-t border-border/70 pt-3">
                    <div className="mb-2 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-bold text-emerald-600">
                          3
                        </span>
                        <h2 className="text-lg font-semibold tracking-tight">
                          Verify authenticator code
                        </h2>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Enter the current 6-digit code to finish setup.
                      </p>
                    </div>

                    <form onSubmit={handleVerify} className="flex flex-col gap-2">
                      <Input
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="123456"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        className="h-11 w-full bg-background text-center font-mono text-xl tracking-[0.3em]"
                        maxLength={8}
                        autoFocus
                        disabled={!totpURI}
                      />
                      <Button
                        type="submit"
                        className="h-11 w-full"
                        disabled={verifyLoading || !totpURI}
                      >
                        {verifyLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ShieldCheck className="h-4 w-4" />
                        )}
                        <span>Verify</span>
                      </Button>
                    </form>
                  </section>
                </div>
              </div>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
