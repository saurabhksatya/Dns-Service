"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addSite, deleteSite, verifySite } from "./actions";
import { authClient } from "@/lib/authClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Globe2,
  Loader2,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  Server,
  ShieldCheck,
  Timer,
  Trash2,
  X,
} from "lucide-react";

const addSiteSchema = z.object({
  domain: z.string().min(1, "Domain is required"),
});

type AddSiteFormValues = z.infer<typeof addSiteSchema>;

export type SiteRow = {
  id: string;
  domain: string;
  status: "PENDING" | "VERIFIED" | "FAILED";
  lastChecked: Date | null;
  failReason: string | null;
  createdAt: Date;
};

const statusConfig: Record<
  SiteRow["status"],
  { label: string; badge: string; dot: string; description: string }
> = {
  VERIFIED: {
    label: "Verified & Active",
    badge: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    dot: "bg-emerald-500",
    description: "Nameservers successfully delegated and ready to resolve records.",
  },
  PENDING: {
    label: "Delegation Pending",
    badge: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    dot: "bg-amber-500 animate-pulse",
    description: "Waiting for NS delegation to ns1.example.com / ns2.example.com.",
  },
  FAILED: {
    label: "Check Failed",
    badge: "bg-red-500/10 text-red-400 border-red-500/20",
    dot: "bg-red-500",
    description: "Could not verify nameserver delegation. Check your registrar settings.",
  },
};

function StatusBadge({ status }: { status: SiteRow["status"] }) {
  const cfg = statusConfig[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border ${cfg.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function formatDate(date: Date | string | null) {
  if (!date) return "Never";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function SitesClient({ sites }: { sites: SiteRow[] }) {
  const router = useRouter();
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [siteToDelete, setSiteToDelete] = useState<SiteRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "VERIFIED" | "PENDING" | "FAILED">("ALL");
  const [copiedNs, setCopiedNs] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState<{
    id: string;
    text: string;
    kind: "success" | "error";
  } | null>(null);

  const form = useForm<AddSiteFormValues>({
    resolver: zodResolver(addSiteSchema),
    defaultValues: { domain: "" },
  });

  // Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && siteToDelete) {
        setSiteToDelete(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [siteToDelete]);

  const filteredSites = useMemo(() => {
    return sites.filter((site) => {
      const matchesSearch = site.domain.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || site.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [sites, searchQuery, statusFilter]);

  const verifiedCount = useMemo(() => sites.filter((s) => s.status === "VERIFIED").length, [sites]);
  const pendingCount = useMemo(() => sites.filter((s) => s.status === "PENDING" || s.status === "FAILED").length, [sites]);

  const onSubmit = async (values: AddSiteFormValues) => {
    setActionError(null);
    const result = await addSite(values.domain);
    if (!result.ok) {
      setActionError(result.error);
      return;
    }
    form.reset();
    router.refresh();
  };

  const onVerify = async (site: SiteRow) => {
    setVerifyingId(site.id);
    setActionError(null);
    setVerifyMessage(null);
    const result = await verifySite(site.id);
    setVerifyingId(null);
    if (!result.ok) {
      setActionError(result.error);
      return;
    }
    setVerifyMessage({
      id: site.id,
      text:
        result.status === "VERIFIED"
          ? "Nameserver delegation verified successfully."
          : (result.error ?? "Nameserver verification failed."),
      kind: result.status === "VERIFIED" ? "success" : "error",
    });
    router.refresh();
  };

  const confirmDeleteSite = async () => {
    if (!siteToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    const result = await deleteSite(siteToDelete.id);
    setIsDeleting(false);
    if (!result.ok) {
      setDeleteError(result.error);
      return;
    }
    setSiteToDelete(null);
    router.refresh();
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/signin");
  };

  const copyNameservers = () => {
    navigator.clipboard.writeText("ns1.example.com\nns2.example.com");
    setCopiedNs(true);
    setTimeout(() => setCopiedNs(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background font-bold text-sm">
                <Globe2 className="h-4 w-4" />
              </span>
              <span className="text-base font-semibold tracking-tight">
                Route<span className="text-muted-foreground font-normal">DNS</span>
              </span>
            </Link>
            <span className="text-xs text-muted-foreground hidden sm:inline-block border-l border-border/60 pl-4">
              Dashboard
            </span>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl w-full flex-1 px-6 py-8">
        {/* Page Title & Stats */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border/60">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Domain Management
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              Register domain zones and configure authoritative DNS records.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-border/80 bg-card px-3.5 py-2">
              <div className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                Total Domains
              </div>
              <div className="text-lg font-bold text-foreground font-mono">{sites.length}</div>
            </div>
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3.5 py-2">
              <div className="text-[10px] uppercase font-semibold text-emerald-500 tracking-wider">
                Verified
              </div>
              <div className="text-lg font-bold text-emerald-500 font-mono">{verifiedCount}</div>
            </div>
            <div className="rounded-lg border border-border/80 bg-card px-3.5 py-2">
              <div className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                Pending
              </div>
              <div className="text-lg font-bold text-muted-foreground font-mono">{pendingCount}</div>
            </div>
          </div>
        </div>

        {/* Nameserver Notice Banner */}
        <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-border/80 bg-card/60 p-4 text-xs">
          <div className="flex items-center gap-2.5">
            <Server className="h-4 w-4 text-foreground shrink-0" />
            <div>
              <span className="font-semibold text-foreground">Authoritative Nameservers:</span>
              <span className="ml-2 font-mono text-muted-foreground">ns1.example.com &bull; ns2.example.com</span>
            </div>
          </div>
          <Button
            variant="outline"
            size="xs"
            onClick={copyNameservers}
            className="gap-1 text-xs shrink-0"
          >
            {copiedNs ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
            {copiedNs ? "Copied" : "Copy Nameservers"}
          </Button>
        </div>

        {/* Register Domain Form */}
        <Card className="mt-6 border-border/80 bg-card shadow-xs">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2 font-semibold">
              <Plus className="h-4 w-4" /> Register New Domain
            </CardTitle>
            <CardDescription className="text-xs">
              Enter your domain name (e.g. <code className="font-mono text-foreground">example.com</code>) to manage its authoritative records.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col sm:flex-row items-start gap-3"
              >
                <div className="flex-1 w-full">
                  <FormField
                    control={form.control}
                    name="domain"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            placeholder="example.com"
                            autoComplete="off"
                            spellCheck={false}
                            className="font-mono text-sm bg-background border-border/80"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button
                  type="submit"
                  size="default"
                  disabled={form.formState.isSubmitting}
                  className="w-full sm:w-auto shrink-0 bg-foreground text-background hover:opacity-90"
                >
                  {form.formState.isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-1" />
                  )}
                  Add Domain
                </Button>
              </form>
            </Form>
            {actionError && (
              <p className="mt-3 text-xs font-medium text-destructive">
                {actionError}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Search & Filter Bar */}
        <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search domains..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-xs h-8 bg-card border-border/80"
            />
          </div>

          <div className="flex items-center gap-1 self-start sm:self-auto bg-card p-1 rounded-lg border border-border/80 text-xs">
            {(["ALL", "VERIFIED", "PENDING", "FAILED"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  statusFilter === st
                    ? "bg-foreground text-background shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {st === "ALL" ? "All" : st.charAt(0) + st.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Domains List */}
        <div className="mt-4 flex flex-col gap-3">
          {filteredSites.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/80 p-12 text-center bg-card/30">
              <Globe2 className="mx-auto h-8 w-8 text-muted-foreground opacity-40 mb-3" />
              <p className="text-sm font-medium text-foreground">
                {searchQuery ? "No domains matched your search" : "No domains registered yet"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {searchQuery
                  ? "Try searching for another domain name."
                  : "Add your first domain above to start managing DNS records."}
              </p>
            </div>
          ) : (
            filteredSites.map((site) => (
              <div
                key={site.id}
                className="group rounded-xl border border-border/80 bg-card p-4 transition-all hover:border-border hover:shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono text-base font-bold text-foreground tracking-tight">
                        {site.domain}
                      </span>
                      <StatusBadge status={site.status} />
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Timer className="h-3 w-3" />
                        Last verified: {formatDate(site.lastChecked)}
                      </span>
                      {site.status === "VERIFIED" && (
                        <span className="inline-flex items-center gap-1 text-emerald-500">
                          <ShieldCheck className="h-3 w-3" />
                          Delegated
                        </span>
                      )}
                    </div>

                    {site.failReason && (
                      <div className="mt-1 flex items-start gap-1.5 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <span>{site.failReason}</span>
                      </div>
                    )}

                    {verifyMessage?.id === site.id && (
                      <div
                        className={`mt-1 flex items-center gap-1.5 text-xs px-2.5 py-1 rounded border ${
                          verifyMessage.kind === "success"
                            ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                            : "text-red-400 bg-red-500/10 border-red-500/20"
                        }`}
                      >
                        {verifyMessage.kind === "success" ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <AlertTriangle className="h-3.5 w-3.5" />
                        )}
                        <span>{verifyMessage.text}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                    {site.status === "VERIFIED" ? (
                      <Button
                        variant="default"
                        size="sm"
                        nativeButton={false}
                        render={<Link href={`/user/sites/${site.id}`} />}
                        className="bg-foreground text-background hover:opacity-90 gap-1 text-xs"
                      >
                        Configure DNS <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onVerify(site)}
                        disabled={verifyingId === site.id || isDeleting}
                        className="gap-1.5 text-xs border-border/80 hover:bg-muted"
                      >
                        {verifyingId === site.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5" />
                        )}
                        Verify Nameservers
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => {
                        setDeleteError(null);
                        setSiteToDelete(site);
                      }}
                      disabled={isDeleting || verifyingId === site.id}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      title="Delete domain"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Delete Domain Confirmation Modal */}
      {siteToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeleting) setSiteToDelete(null);
          }}
        >
          <div className="w-full max-w-md rounded-xl border border-border/80 bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-full bg-destructive/15 text-destructive flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-1 flex-1">
                <h3 className="text-base font-bold text-foreground">
                  Delete Domain
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Are you sure you want to delete <span className="font-mono font-semibold text-foreground">{siteToDelete.domain}</span>? All configured DNS records for this domain will be permanently deleted. This action cannot be undone.
                </p>
              </div>
              <button
                onClick={() => !isDeleting && setSiteToDelete(null)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
                disabled={isDeleting}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {deleteError && (
              <p className="text-xs font-medium text-destructive bg-destructive/10 border border-destructive/20 p-2.5 rounded">
                {deleteError}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSiteToDelete(null)}
                disabled={isDeleting}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={confirmDeleteSite}
                disabled={isDeleting}
                className="text-xs gap-1.5"
              >
                {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Delete Domain
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
