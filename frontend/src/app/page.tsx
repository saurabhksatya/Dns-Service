"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  Copy,
  Database,
  Globe2,
  Layers,
  Loader2,
  LogOut,
  ShieldCheck,
  Terminal,
  User,
  Zap,
} from "lucide-react";
import { authClient } from "@/lib/authClient";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"A" | "AAAA" | "CNAME" | "TXT">("A");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const digCommand = "dig @ns1.mdp.dpdns.org example.com A";

  const handleCopy = () => {
    navigator.clipboard.writeText(digCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await authClient.signOut();
    setIsSigningOut(false);
    setIsProfileOpen(false);
    router.refresh();
  };

  // Close profile dropdown on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const sampleResponses: Record<
    "A" | "AAAA" | "CNAME" | "TXT",
    { name: string; type: string; value: string; ttl: number }
  > = {
    A: { name: "example.com.", type: "A", value: "93.184.216.34", ttl: 300 },
    AAAA: {
      name: "example.com.",
      type: "AAAA",
      value: "2606:2800:220:1:248:1893:25c8:1946",
      ttl: 300,
    },
    CNAME: {
      name: "www.example.com.",
      type: "CNAME",
      value: "example.com.",
      ttl: 300,
    },
    TXT: {
      name: "example.com.",
      type: "TXT",
      value: '"v=spf1 include:_spf.google.com ~all"',
      ttl: 300,
    },
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-white selection:text-black overflow-x-hidden font-sans">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background font-bold text-sm tracking-tight transition-transform group-hover:scale-105">
                <Globe2 className="h-4 w-4" />
              </span>
              <span className="text-base font-semibold tracking-tight">
                Route
                <span className="text-muted-foreground font-normal">DNS</span>
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            {!isPending && session?.user ? (
              // Logged in Header State
              <div className="flex items-center gap-3" ref={profileRef}>
                <Link
                  href="/user/dashboard"
                  className="rounded-md bg-foreground px-3.5 py-1.5 text-xs font-medium text-background transition-opacity hover:opacity-90"
                >
                  Dashboard
                </Link>

                {/* Profile Button & Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen((prev) => !prev)}
                    className="flex size-8 items-center justify-center rounded-full border border-border bg-card text-foreground font-semibold text-xs transition-colors hover:bg-muted cursor-pointer"
                    title="User Profile"
                    aria-label="User Profile"
                  >
                    {session.user.name ? (
                      session.user.name.charAt(0).toUpperCase()
                    ) : (
                      <User className="size-4" />
                    )}
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border/80 bg-card p-3 shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 z-50">
                      <div className="border-b border-border/60 pb-2.5 px-1">
                        <p className="font-semibold text-xs text-foreground truncate">
                          {session.user.name || "User"}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {session.user.email}
                        </p>
                      </div>

                      <div className="pt-2 space-y-1">
                        <Link
                          href="/user/dashboard"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-muted transition-colors"
                        >
                          <span>Dashboard</span>
                          <ArrowRight className="size-3 text-muted-foreground" />
                        </Link>

                        <button
                          onClick={handleSignOut}
                          disabled={isSigningOut}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                        >
                          {isSigningOut ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <LogOut className="size-3.5" />
                          )}
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : !isPending ? (
              // Logged out Header State
              <div className="flex items-center gap-2">
                <Link
                  href="/signin"
                  className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="rounded-md bg-foreground px-3.5 py-1.5 text-xs font-medium text-background transition-opacity hover:opacity-90"
                >
                  Get Started
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {/* Hero Section (Matching Screenshot) */}
      <section className="relative flex flex-col items-center justify-center px-6 pt-24 pb-20 md:pt-36 md:pb-28 text-center overflow-hidden border-b border-border/40">
        {/* Subtle Dashed Grid & Geometric Circles */}
        <div className="pointer-events-none absolute inset-0 -z-10 select-none">
          {/* Subtle horizontal grid lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_45%,#000_60%,transparent_100%)]" />

          {/* Dotted / Dashed Grid Accent Lines */}
          <div className="absolute top-1/2 left-0 right-0 h-px border-t border-dashed border-border/40" />
          <div className="absolute top-1/4 left-0 right-0 h-px border-t border-dashed border-border/30" />
          <div className="absolute top-3/4 left-0 right-0 h-px border-t border-dashed border-border/30" />
          <div className="absolute left-1/4 top-0 bottom-0 w-px border-l border-dashed border-border/30" />
          <div className="absolute left-3/4 top-0 bottom-0 w-px border-l border-dashed border-border/30" />

          {/* Concentric Subtle Geometric Accent Circles */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[650px] rounded-full border border-dashed border-border/25 pointer-events-none opacity-60" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[900px] rounded-full border border-border/15 pointer-events-none opacity-40" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[1150px] rounded-full border border-dashed border-border/10 pointer-events-none opacity-20" />

          {/* Corner Intersection Dots */}
          <div className="absolute top-1/4 left-1/4 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-border" />
          <div className="absolute top-1/4 left-3/4 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-border" />
          <div className="absolute top-3/4 left-1/4 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-border" />
          <div className="absolute top-3/4 left-3/4 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-border" />
        </div>

        {/* Hero Title */}
        <div className="mx-auto max-w-4xl">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl md:text-7xl lg:text-[5.2rem] text-foreground leading-[1.08]">
            The DNS Platform for the Web
          </h1>

          {/* CTA Buttons */}
          <div className="mt-9 flex items-center justify-center gap-3.5">
            {session?.user ? (
              <>
                <Link
                  href="/user/dashboard"
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-transform active:scale-95 hover:opacity-90 shadow-sm"
                >
                  Open Dashboard <ArrowRight className="size-4" />
                </Link>
                <a
                  href="#records"
                  className="inline-flex items-center justify-center rounded-lg border border-border/80 bg-card px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted active:scale-95"
                >
                  Explore DNS Engine
                </a>
              </>
            ) : (
              <>
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-lg bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-transform active:scale-95 hover:opacity-90 shadow-sm"
                >
                  Get Started
                </Link>
                <Link
                  href="/signin"
                  className="inline-flex items-center justify-center rounded-lg border border-border/80 bg-card px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted active:scale-95"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>

          {/* Terminal Snippet */}
          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/50 px-4 py-1.5 text-xs font-mono text-muted-foreground backdrop-blur-xs transition-colors hover:border-border hover:bg-muted">
            <span className="text-[10px] text-foreground">▲</span>
            <span>~</span>
            <span className="text-foreground">{digCommand}</span>
            <button
              onClick={handleCopy}
              className="ml-2 inline-flex items-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Copy to clipboard"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Interactive DNS Engine Demo & Preview */}
      <section
        id="records"
        className="mx-auto max-w-6xl px-6 py-20 border-b border-border/40"
      >
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground bg-muted/30">
            <Terminal className="h-3.5 w-3.5 text-foreground" />
            <span>Authoritative Engine Demo</span>
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl text-foreground">
            Fast, Database-Backed DNS Resolution
          </h2>
          <p className="mt-3 max-w-xl text-sm md:text-base text-muted-foreground">
            Queries sent to the Go DNS server query the database and return
            authoritative answers with sub-millisecond overhead.
          </p>
        </div>

        <div className="mt-12 overflow-hidden rounded-xl border border-border/80 bg-card/60 shadow-2xl backdrop-blur-sm">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between border-b border-border/80 px-5 py-3.5 bg-muted/30">
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-red-500/80" />
              <span className="size-3 rounded-full bg-amber-500/80" />
              <span className="size-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 font-mono text-xs text-muted-foreground">
                routedns-server (UDP)
              </span>
            </div>

            <div className="flex items-center gap-1 bg-background/80 p-1 rounded-lg border border-border/60">
              {(["A", "AAAA", "CNAME", "TXT"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`px-3 py-1 text-xs font-mono font-medium rounded-md transition-all ${
                    activeTab === t
                      ? "bg-foreground text-background shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t} Record
                </button>
              ))}
            </div>
          </div>

          {/* Query Terminal View */}
          <div className="p-6 font-mono text-xs md:text-sm leading-relaxed space-y-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="text-emerald-500">$</span>
              <span>
                dig @ns1.mdp.dpdns.org {sampleResponses[activeTab].name}{" "}
                {activeTab}
              </span>
            </div>

            <div className="rounded-lg bg-background/90 p-4 border border-border/60 space-y-2 text-muted-foreground">
              <p className="text-muted-foreground/70">
                ; &lt;&lt;&gt;&gt; DiG 9.10.6 &lt;&lt;&gt;&gt;
                @ns1.mdp.dpdns.org {sampleResponses[activeTab].name} {activeTab}
              </p>
              <p className="text-muted-foreground/70">
                ;; Got answer: HEADER; opcode: QUERY, status:{" "}
                <span className="text-emerald-400 font-semibold">NOERROR</span>,
                id: 48291
              </p>
              <p className="text-muted-foreground/70">
                ;; flags: qr aa rd; QUERY: 1, ANSWER: 1, AUTHORITY: 2,
                ADDITIONAL: 1
              </p>

              <div className="pt-2 border-t border-border/40 text-foreground">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 font-sans">
                  ;; ANSWER SECTION:
                </p>
                <div className="flex flex-wrap items-center gap-4 bg-muted/40 p-2.5 rounded border border-border/40">
                  <span className="text-foreground font-semibold">
                    {sampleResponses[activeTab].name}
                  </span>
                  <span className="text-muted-foreground">
                    {sampleResponses[activeTab].ttl}
                  </span>
                  <span className="text-muted-foreground">IN</span>
                  <span className="font-bold text-amber-500">
                    {sampleResponses[activeTab].type}
                  </span>
                  <span className="text-emerald-400 font-mono">
                    {sampleResponses[activeTab].value}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-border/40 text-muted-foreground/80 text-xs">
                <p>;; Query time: 0.82 msec</p>
                <p>;; SERVER: ns1.mdp.dpdns.org#53(ns1.mdp.dpdns.org)</p>
                <p>;; WHEN: {new Date().toUTCString()}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        id="quickstart"
        className="mx-auto max-w-4xl px-6 py-24 text-center"
      >
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-foreground">
          Ready to manage your DNS?
        </h2>
        <p className="mt-4 text-muted-foreground max-w-lg mx-auto text-sm md:text-base">
          Sign up to register your domains, verify nameserver delegation, and
          publish DNS records in seconds.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          {session?.user ? (
            <Link
              href="/user/dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              Go to Dashboard <ArrowRight className="size-4" />
            </Link>
          ) : (
            <>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-lg bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                Get Started <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/signin"
                className="inline-flex items-center rounded-lg border border-border/80 bg-card px-6 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                Sign In
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 px-6 text-xs text-muted-foreground bg-background">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <Globe2 className="h-4 w-4" />
            <span>RouteDNS &copy; {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="#features"
              className="hover:text-foreground transition-colors"
            >
              Features
            </a>
            <a
              href="#architecture"
              className="hover:text-foreground transition-colors"
            >
              Architecture
            </a>
            {session?.user ? (
              <Link
                href="/user/dashboard"
                className="hover:text-foreground transition-colors"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/signin"
                  className="hover:text-foreground transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="hover:text-foreground transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
