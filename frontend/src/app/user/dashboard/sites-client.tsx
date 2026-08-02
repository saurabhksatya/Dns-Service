"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addSite, deleteSite, verifySite } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
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
  CheckCircle2,
  CircleAlert,
  Globe2,
  Loader2,
  Plus,
  RefreshCw,
  ShieldCheck,
  Timer,
  Trash2,
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

const statusStyles: Record<
  SiteRow["status"],
  { label: string; badge: string; dot: string }
> = {
  PENDING: {
    label: "Pending",
    badge: "bg-amber-50 text-amber-700 ring-amber-600/20",
    dot: "bg-amber-500",
  },
  VERIFIED: {
    label: "Verified",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    dot: "bg-emerald-500",
  },
  FAILED: {
    label: "Failed",
    badge: "bg-red-50 text-red-700 ring-red-600/20",
    dot: "bg-red-500",
  },
};

function StatusBadge({ status }: { status: SiteRow["status"] }) {
  const s = statusStyles[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${s.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function formatDate(date: Date | null) {
  if (!date) return "Never";
  return date.toLocaleString();
}

export default function SitesClient({ sites }: { sites: SiteRow[] }) {
  const router = useRouter();
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [verifyMessage, setVerifyMessage] = useState<{
    id: string;
    text: string;
    kind: "success" | "error";
  } | null>(null);

  const form = useForm<AddSiteFormValues>({
    resolver: zodResolver(addSiteSchema),
    defaultValues: { domain: "" },
  });

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
      text: result.status === "VERIFIED" ? "Verification successful." : (result.error ?? "Verification failed."),
      kind: result.status === "VERIFIED" ? "success" : "error",
    });
    router.refresh();
  };

  const onDelete = async (site: SiteRow) => {
    setDeletingId(site.id);
    setActionError(null);
    setVerifyMessage(null);
    const result = await deleteSite(site.id);
    setDeletingId(null);
    if (!result.ok) {
      setActionError(result.error);
      return;
    }
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
              <Globe2 className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold tracking-tight">
              Route<span className="text-emerald-600">DNS</span>
            </span>
          </div>
          <span className="text-sm text-slate-500">User Dashboard</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Your Sites</h1>
          <p className="text-sm text-slate-600">
            Domains registered to your account. Verify ownership by pointing
            your nameservers to RouteDNS.
          </p>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Register a Site
            </CardTitle>
            <CardDescription>
              Enter a domain to add it to your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col gap-4"
              >
                <FormField
                  control={form.control}
                  name="domain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Domain</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="example.com"
                          autoComplete="off"
                          spellCheck={false}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {actionError && (
                  <p className="text-sm font-medium text-destructive">
                    {actionError}
                  </p>
                )}
                <Button
                  type="submit"
                  className="self-start"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting && (
                    <Loader2 className="animate-spin" />
                  )}
                  Add Site
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="mt-8 flex flex-col gap-4">
          {sites.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                <Globe2 className="h-8 w-8 text-slate-300" />
                <p className="text-sm font-medium text-slate-700">
                  No sites registered yet
                </p>
                <p className="text-sm text-slate-500">
                  Add your first domain above to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            sites.map((site) => (
              <Card key={site.id}>
                <CardContent className="flex flex-col gap-4 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-semibold">
                        {site.domain}
                      </span>
                      <StatusBadge status={site.status} />
                    </div>
                    <div className="flex flex-col gap-1 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1.5">
                        <Timer className="h-3.5 w-3.5" />
                        Last checked: {formatDate(site.lastChecked)}
                      </span>
                      {site.status === "VERIFIED" && (
                        <span className="inline-flex items-center gap-1.5 text-emerald-600">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Ownership verified
                        </span>
                      )}
                      {site.failReason && (
                        <span className="inline-flex items-start gap-1.5 text-red-600">
                          <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          {site.failReason}
                        </span>
                      )}
                      {verifyMessage?.id === site.id &&
                        verifyMessage.kind === "success" && (
                          <span className="inline-flex items-center gap-1.5 text-emerald-600">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {verifyMessage.text}
                          </span>
                        )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {site.status === "VERIFIED" && (
                      <Button
                        variant="secondary"
                        size="sm"
                        render={<Link href={`/user/sites/${site.id}`} />}
                      >
                        Configure
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onVerify(site)}
                      disabled={verifyingId === site.id || deletingId === site.id}
                    >
                      {verifyingId === site.id ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <RefreshCw />
                      )}
                      Verify
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onDelete(site)}
                      disabled={deletingId === site.id || verifyingId === site.id}
                    >
                      {deletingId === site.id ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <Trash2 />
                      )}
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
