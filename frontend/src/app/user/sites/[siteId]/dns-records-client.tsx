"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  addDnsRecord,
  deleteDnsRecord,
  updateDnsRecord,
  type DnsRecordRow,
} from "../../dashboard/actions";
import type { SiteRow } from "../../dashboard/sites-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Copy,
  Layers,
  Loader2,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Terminal,
  Trash2,
  X,
} from "lucide-react";

const recordSchema = z.object({
  type: z.enum(["A", "AAAA", "CNAME"]),
  name: z.string().min(1, "Name is required"),
  value: z.string().min(1, "Value is required"),
  ttl: z
    .string()
    .min(1, "TTL is required")
    .regex(/^\d+$/, "TTL must be a positive integer"),
});

type RecordFormValues = z.infer<typeof recordSchema>;

const typeDescriptions: Record<
  RecordFormValues["type"],
  { help: string; placeholder: string; example: string }
> = {
  A: {
    help: "Maps a hostname to an IPv4 address",
    placeholder: "192.0.2.1",
    example: "93.184.216.34",
  },
  AAAA: {
    help: "Maps a hostname to an IPv6 address",
    placeholder: "2001:0db8:85a3::8a2e:0370:7334",
    example: "2606:2800:220:1:248:1893:25c8:1946",
  },
  CNAME: {
    help: "Maps a hostname to another target domain",
    placeholder: "target.example.net",
    example: "cdn.example.com",
  },
};

const ttlPresets = [
  { label: "1 min", value: "60" },
  { label: "5 min", value: "300" },
  { label: "1 hr", value: "3600" },
  { label: "1 day", value: "86400" },
];

function RecordTypeBadge({ type }: { type: DnsRecordRow["type"] }) {
  const styles: Record<DnsRecordRow["type"], string> = {
    A: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    AAAA: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    CNAME: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  };
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 font-mono text-[11px] font-bold border ${styles[type]}`}
    >
      {type}
    </span>
  );
}

function getFqdn(name: string, domain: string) {
  if (name === "@" || name === "" || !name) return domain;
  return `${name}.${domain}`;
}

export default function DnsRecordsClient({
  site,
  records,
}: {
  site: SiteRow;
  records: DnsRecordRow[];
}) {
  const router = useRouter();
  const [editingRecord, setEditingRecord] = useState<DnsRecordRow | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<DnsRecordRow | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "A" | "AAAA" | "CNAME">(
    "ALL",
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Add Form
  const addForm = useForm<RecordFormValues>({
    resolver: zodResolver(recordSchema),
    defaultValues: { type: "A", name: "@", value: "", ttl: "300" },
  });

  // Edit Modal Form
  const editForm = useForm<RecordFormValues>({
    resolver: zodResolver(recordSchema),
    defaultValues: { type: "A", name: "@", value: "", ttl: "300" },
  });

  const watchAddType =
    useWatch({ control: addForm.control, name: "type" }) || "A";
  const watchAddName =
    useWatch({ control: addForm.control, name: "name" }) || "@";
  const watchAddValue =
    useWatch({ control: addForm.control, name: "value" }) || "";
  const watchAddTtl =
    useWatch({ control: addForm.control, name: "ttl" }) || "300";

  const watchEditType =
    useWatch({ control: editForm.control, name: "type" }) || "A";
  const watchEditName =
    useWatch({ control: editForm.control, name: "name" }) || "@";
  const watchEditValue =
    useWatch({ control: editForm.control, name: "value" }) || "";
  const watchEditTtl =
    useWatch({ control: editForm.control, name: "ttl" }) || "300";

  // Escape key handler for modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (editingRecord) setEditingRecord(null);
        if (recordToDelete && !isDeleting) setRecordToDelete(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editingRecord, recordToDelete, isDeleting]);

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchesSearch =
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.value.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === "ALL" || r.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [records, searchQuery, typeFilter]);

  const recordStats = useMemo(() => {
    return {
      total: records.length,
      a: records.filter((r) => r.type === "A").length,
      aaaa: records.filter((r) => r.type === "AAAA").length,
      cname: records.filter((r) => r.type === "CNAME").length,
    };
  }, [records]);

  const copyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const onAddSubmit = async (values: RecordFormValues) => {
    setActionError(null);
    setSuccessMessage(null);
    const result = await addDnsRecord(site.id, {
      type: values.type,
      name: values.name,
      value: values.value,
      ttl: Number(values.ttl),
    });
    if (!result.ok) {
      setActionError(result.error);
      return;
    }
    setSuccessMessage("DNS record published successfully.");
    addForm.reset({ type: values.type, name: "@", value: "", ttl: "300" });
    router.refresh();
  };

  const onEditStart = (record: DnsRecordRow) => {
    setEditingRecord(record);
    setEditError(null);
    editForm.reset({
      type: record.type,
      name: record.name,
      value: record.value,
      ttl: String(record.ttl),
    });
  };

  const onEditClose = () => {
    setEditingRecord(null);
    setEditError(null);
  };

  const onEditSubmit = async (values: RecordFormValues) => {
    if (!editingRecord) return;
    setEditError(null);
    const result = await updateDnsRecord(editingRecord.id, site.id, {
      type: values.type,
      name: values.name,
      value: values.value,
      ttl: Number(values.ttl),
    });
    if (!result.ok) {
      setEditError(result.error);
      return;
    }
    setEditingRecord(null);
    setSuccessMessage("DNS record updated successfully.");
    router.refresh();
  };

  const confirmDeleteRecord = async () => {
    if (!recordToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    const result = await deleteDnsRecord(recordToDelete.id, site.id);
    setIsDeleting(false);
    if (!result.ok) {
      setDeleteError(result.error);
      return;
    }
    setRecordToDelete(null);
    setSuccessMessage("Record deleted.");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Top App Header */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-4">
            <Link
              href="/user/dashboard"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Dashboard</span>
            </Link>
            <span className="text-muted-foreground/40">/</span>
            <span className="font-mono text-xs font-semibold text-foreground">
              {site.domain}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl w-full flex-1 px-6 py-8">
        {/* Domain Title & Delegation Status */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border/60">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight font-mono text-foreground">
                {site.domain}
              </h1>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                <ShieldCheck className="h-3.5 w-3.5" />
                Delegated &amp; Authoritative
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Authoritative DNS records stored in database and served on port
              8001.
            </p>
          </div>

          {/* Quick Record Stats */}
          <div className="flex items-center gap-2">
            <div className="rounded-lg border border-border/80 bg-card px-3 py-1.5 text-center">
              <div className="text-[10px] uppercase font-semibold text-muted-foreground">
                Total
              </div>
              <div className="text-sm font-bold font-mono text-foreground">
                {recordStats.total}
              </div>
            </div>
            <div className="rounded-lg border border-sky-500/20 bg-sky-500/5 px-3 py-1.5 text-center">
              <div className="text-[10px] uppercase font-semibold text-sky-400">
                A
              </div>
              <div className="text-sm font-bold font-mono text-sky-400">
                {recordStats.a}
              </div>
            </div>
            <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 px-3 py-1.5 text-center">
              <div className="text-[10px] uppercase font-semibold text-indigo-400">
                AAAA
              </div>
              <div className="text-sm font-bold font-mono text-indigo-400">
                {recordStats.aaaa}
              </div>
            </div>
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-1.5 text-center">
              <div className="text-[10px] uppercase font-semibold text-amber-400">
                CNAME
              </div>
              <div className="text-sm font-bold font-mono text-amber-400">
                {recordStats.cname}
              </div>
            </div>
          </div>
        </div>

        {/* Workspace Layout */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[380px_1fr]">
          {/* Left Column: Add Record Form */}
          <div className="space-y-4">
            <Card className="border-border/80 bg-card shadow-xs">
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2 font-semibold">
                  <Plus className="h-4 w-4" /> Add DNS Record
                </CardTitle>
                <CardDescription className="text-xs">
                  Create a new authoritative record for this zone.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...addForm}>
                  <form
                    onSubmit={addForm.handleSubmit(onAddSubmit)}
                    className="flex flex-col gap-4"
                  >
                    {/* Record Type */}
                    <FormField
                      control={addForm.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium">
                            Record Type
                          </FormLabel>
                          <FormControl>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger className="w-full bg-background border-border/80 font-mono text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="A">
                                  A (IPv4 Address)
                                </SelectItem>
                                <SelectItem value="AAAA">
                                  AAAA (IPv6 Address)
                                </SelectItem>
                                <SelectItem value="CNAME">
                                  CNAME (Alias Hostname)
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <p className="text-[11px] text-muted-foreground">
                            {typeDescriptions[watchAddType].help}
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Record Name / Host */}
                    <FormField
                      control={addForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel className="text-xs font-medium">
                              Name / Host
                            </FormLabel>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => addForm.setValue("name", "@")}
                                className="text-[10px] text-muted-foreground hover:text-foreground bg-muted px-1.5 py-0.5 rounded transition-colors"
                              >
                                @ (Apex)
                              </button>
                              <button
                                type="button"
                                onClick={() => addForm.setValue("name", "www")}
                                className="text-[10px] text-muted-foreground hover:text-foreground bg-muted px-1.5 py-0.5 rounded transition-colors"
                              >
                                www
                              </button>
                              <button
                                type="button"
                                onClick={() => addForm.setValue("name", "api")}
                                className="text-[10px] text-muted-foreground hover:text-foreground bg-muted px-1.5 py-0.5 rounded transition-colors"
                              >
                                api
                              </button>
                            </div>
                          </div>
                          <FormControl>
                            <Input
                              placeholder="@"
                              spellCheck={false}
                              autoComplete="off"
                              className="font-mono text-xs bg-background border-border/80"
                              {...field}
                            />
                          </FormControl>
                          <p className="text-[11px] font-mono text-muted-foreground">
                            FQDN:{" "}
                            <span className="text-foreground">
                              {getFqdn(field.value, site.domain)}
                            </span>
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Record Value / Target */}
                    <FormField
                      control={addForm.control}
                      name="value"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium">
                            Value / Target
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={
                                typeDescriptions[watchAddType].placeholder
                              }
                              spellCheck={false}
                              autoComplete="off"
                              className="font-mono text-xs bg-background border-border/80"
                              {...field}
                            />
                          </FormControl>
                          <p className="text-[11px] text-muted-foreground">
                            Example:{" "}
                            <span className="font-mono text-foreground/80">
                              {typeDescriptions[watchAddType].example}
                            </span>
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* TTL with Preset Chips */}
                    <FormField
                      control={addForm.control}
                      name="ttl"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel className="text-xs font-medium">
                              TTL (Seconds)
                            </FormLabel>
                            <div className="flex items-center gap-1">
                              {ttlPresets.map((p) => (
                                <button
                                  key={p.value}
                                  type="button"
                                  onClick={() =>
                                    addForm.setValue("ttl", p.value)
                                  }
                                  className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                                    field.value === p.value
                                      ? "bg-foreground text-background font-bold"
                                      : "bg-muted text-muted-foreground hover:text-foreground"
                                  }`}
                                >
                                  {p.label}
                                </button>
                              ))}
                            </div>
                          </div>
                          <FormControl>
                            <Input
                              inputMode="numeric"
                              placeholder="300"
                              className="font-mono text-xs bg-background border-border/80"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Live Resolution Preview */}
                    <div className="rounded-lg border border-border/80 bg-background/80 p-3 space-y-1">
                      <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Live DNS Answer Preview
                      </div>
                      <div className="font-mono text-xs text-foreground truncate">
                        <span className="text-emerald-400">
                          {getFqdn(watchAddName, site.domain)}.
                        </span>{" "}
                        <span className="text-muted-foreground">
                          {watchAddTtl || 300}
                        </span>{" "}
                        IN{" "}
                        <span className="font-bold text-amber-400">
                          {watchAddType}
                        </span>{" "}
                        <span className="text-foreground">
                          {watchAddValue || "..."}
                        </span>
                      </div>
                    </div>

                    {actionError && (
                      <p className="text-xs font-medium text-destructive">
                        {actionError}
                      </p>
                    )}
                    {successMessage && (
                      <p className="text-xs font-medium text-emerald-500">
                        {successMessage}
                      </p>
                    )}

                    <div className="flex gap-2 pt-1">
                      <Button
                        type="submit"
                        className="flex-1 bg-foreground text-background hover:opacity-90 text-xs"
                        disabled={addForm.formState.isSubmitting}
                      >
                        {addForm.formState.isSubmitting && (
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                        )}
                        Publish DNS Record
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Test Query Helper */}
            <div className="rounded-xl border border-border/80 bg-card/60 p-4 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Local DNS Query Helper</span>
              </div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Test query your local Go authoritative server running on port
                8001:
              </p>
              <div className="flex items-center justify-between rounded bg-background p-2 border border-border/60 font-mono text-[11px] text-muted-foreground">
                <span className="truncate">
                  dig @ns1.mdp.dpdns.org {site.domain} A
                </span>
                <button
                  onClick={() =>
                    copyText(
                      "dig-helper",
                      `dig @ns1.mdp.dpdns.org ${site.domain} A`,
                    )
                  }
                  className="ml-2 text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
                  title="Copy command"
                >
                  {copiedId === "dig-helper" ? (
                    <Check className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Records Table & Search */}
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search records by name or target value..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 text-xs h-8 bg-card border-border/80"
                />
              </div>

              <div className="flex items-center gap-1 self-start sm:self-auto bg-card p-1 rounded-lg border border-border/80 text-xs">
                {(["ALL", "A", "AAAA", "CNAME"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={`px-2.5 py-1 rounded font-medium transition-colors ${
                      typeFilter === t
                        ? "bg-foreground text-background shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t === "ALL" ? "All" : t}
                  </button>
                ))}
              </div>
            </div>

            {/* Records List Table */}
            <Card className="border-border/80 bg-card overflow-hidden">
              {filteredRecords.length === 0 ? (
                <div className="p-12 text-center">
                  <Layers className="mx-auto h-8 w-8 text-muted-foreground opacity-30 mb-3" />
                  <p className="text-sm font-medium text-foreground">
                    {searchQuery
                      ? "No matching records found"
                      : "No DNS records published yet"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {searchQuery
                      ? "Try changing your search term or type filter."
                      : "Use the form on the left to add your first A, AAAA or CNAME record."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="border-b border-border/60 bg-muted/30 text-muted-foreground uppercase font-semibold text-[10px] tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Host / Name</th>
                        <th className="px-4 py-3">Value / Target</th>
                        <th className="px-4 py-3">TTL</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {filteredRecords.map((record) => {
                        const fqdn = getFqdn(record.name, site.domain);
                        return (
                          <tr
                            key={record.id}
                            className="group hover:bg-muted/40 transition-colors"
                          >
                            <td className="px-4 py-3 font-medium">
                              <RecordTypeBadge type={record.type} />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5 font-mono text-foreground font-semibold">
                                <span>{fqdn}</span>
                                <button
                                  onClick={() =>
                                    copyText(`host-${record.id}`, fqdn)
                                  }
                                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground cursor-pointer"
                                  title="Copy FQDN"
                                >
                                  {copiedId === `host-${record.id}` ? (
                                    <Check className="h-3 w-3 text-emerald-500" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </button>
                              </div>
                              {record.name !== "@" && record.name !== "" && (
                                <span className="text-[10px] font-mono text-muted-foreground">
                                  ({record.name})
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5 font-mono text-muted-foreground group-hover:text-foreground transition-colors">
                                <span className="truncate max-w-[220px]">
                                  {record.value}
                                </span>
                                <button
                                  onClick={() =>
                                    copyText(`val-${record.id}`, record.value)
                                  }
                                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground cursor-pointer"
                                  title="Copy value"
                                >
                                  {copiedId === `val-${record.id}` ? (
                                    <Check className="h-3 w-3 text-emerald-500" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </button>
                              </div>
                            </td>
                            <td className="px-4 py-3 font-mono text-muted-foreground">
                              {record.ttl}s
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  onClick={() => onEditStart(record)}
                                  disabled={isDeleting}
                                  className="text-muted-foreground hover:text-foreground"
                                  title="Edit record"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  onClick={() => {
                                    setDeleteError(null);
                                    setRecordToDelete(record);
                                  }}
                                  disabled={isDeleting}
                                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                  title="Delete record"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>

      {/* Edit Record Modal */}
      {editingRecord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) onEditClose();
          }}
        >
          <div className="w-full max-w-lg rounded-xl border border-border/80 bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Pencil className="h-4 w-4 text-foreground" />
                <h2 className="text-base font-bold text-foreground">
                  Edit DNS Record
                </h2>
              </div>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={onEditClose}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <Form {...editForm}>
              <form
                onSubmit={editForm.handleSubmit(onEditSubmit)}
                className="flex flex-col gap-4"
              >
                {/* Type */}
                <FormField
                  control={editForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium">
                        Record Type
                      </FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="w-full bg-background border-border/80 font-mono text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A">A (IPv4 Address)</SelectItem>
                            <SelectItem value="AAAA">
                              AAAA (IPv6 Address)
                            </SelectItem>
                            <SelectItem value="CNAME">
                              CNAME (Alias Hostname)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <p className="text-[11px] text-muted-foreground">
                        {typeDescriptions[watchEditType].help}
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Host / Name */}
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-xs font-medium">
                          Name / Host
                        </FormLabel>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => editForm.setValue("name", "@")}
                            className="text-[10px] text-muted-foreground hover:text-foreground bg-muted px-1.5 py-0.5 rounded transition-colors"
                          >
                            @ (Apex)
                          </button>
                          <button
                            type="button"
                            onClick={() => editForm.setValue("name", "www")}
                            className="text-[10px] text-muted-foreground hover:text-foreground bg-muted px-1.5 py-0.5 rounded transition-colors"
                          >
                            www
                          </button>
                          <button
                            type="button"
                            onClick={() => editForm.setValue("name", "api")}
                            className="text-[10px] text-muted-foreground hover:text-foreground bg-muted px-1.5 py-0.5 rounded transition-colors"
                          >
                            api
                          </button>
                        </div>
                      </div>
                      <FormControl>
                        <Input
                          placeholder="@"
                          spellCheck={false}
                          autoComplete="off"
                          className="font-mono text-xs bg-background border-border/80"
                          {...field}
                        />
                      </FormControl>
                      <p className="text-[11px] font-mono text-muted-foreground">
                        FQDN:{" "}
                        <span className="text-foreground">
                          {getFqdn(field.value, site.domain)}
                        </span>
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Value / Target */}
                <FormField
                  control={editForm.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium">
                        Value / Target
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={
                            typeDescriptions[watchEditType].placeholder
                          }
                          spellCheck={false}
                          autoComplete="off"
                          className="font-mono text-xs bg-background border-border/80"
                          {...field}
                        />
                      </FormControl>
                      <p className="text-[11px] text-muted-foreground">
                        Example:{" "}
                        <span className="font-mono text-foreground/80">
                          {typeDescriptions[watchEditType].example}
                        </span>
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* TTL */}
                <FormField
                  control={editForm.control}
                  name="ttl"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-xs font-medium">
                          TTL (Seconds)
                        </FormLabel>
                        <div className="flex items-center gap-1">
                          {ttlPresets.map((p) => (
                            <button
                              key={p.value}
                              type="button"
                              onClick={() => editForm.setValue("ttl", p.value)}
                              className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                                field.value === p.value
                                  ? "bg-foreground text-background font-bold"
                                  : "bg-muted text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <FormControl>
                        <Input
                          inputMode="numeric"
                          placeholder="300"
                          className="font-mono text-xs bg-background border-border/80"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Live Resolution Preview */}
                <div className="rounded-lg border border-border/80 bg-background/80 p-3 space-y-1">
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Updated DNS Answer Preview
                  </div>
                  <div className="font-mono text-xs text-foreground truncate">
                    <span className="text-emerald-400">
                      {getFqdn(watchEditName, site.domain)}.
                    </span>{" "}
                    <span className="text-muted-foreground">
                      {watchEditTtl || 300}
                    </span>{" "}
                    IN{" "}
                    <span className="font-bold text-amber-400">
                      {watchEditType}
                    </span>{" "}
                    <span className="text-foreground">
                      {watchEditValue || "..."}
                    </span>
                  </div>
                </div>

                {editError && (
                  <p className="text-xs font-medium text-destructive">
                    {editError}
                  </p>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onEditClose}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-foreground text-background hover:opacity-90 text-xs"
                    disabled={editForm.formState.isSubmitting}
                  >
                    {editForm.formState.isSubmitting && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    )}
                    Save Changes
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      )}

      {/* Delete Record Confirmation Modal */}
      {recordToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeleting)
              setRecordToDelete(null);
          }}
        >
          <div className="w-full max-w-md rounded-xl border border-border/80 bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-full bg-destructive/15 text-destructive flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-1.5 flex-1">
                <h3 className="text-base font-bold text-foreground">
                  Delete DNS Record
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Are you sure you want to delete this record? Queries for this
                  host will no longer resolve:
                </p>
                <div className="p-2.5 rounded bg-background border border-border/60 font-mono text-xs flex items-center gap-2">
                  <RecordTypeBadge type={recordToDelete.type} />
                  <span className="font-semibold text-foreground">
                    {getFqdn(recordToDelete.name, site.domain)}
                  </span>
                  <span className="text-muted-foreground">&rarr;</span>
                  <span className="text-muted-foreground truncate">
                    {recordToDelete.value}
                  </span>
                </div>
              </div>
              <button
                onClick={() => !isDeleting && setRecordToDelete(null)}
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
                onClick={() => setRecordToDelete(null)}
                disabled={isDeleting}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={confirmDeleteRecord}
                disabled={isDeleting}
                className="text-xs gap-1.5"
              >
                {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Delete Record
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
