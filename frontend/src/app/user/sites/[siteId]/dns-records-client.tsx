"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
  ArrowLeft,
  Globe2,
  Loader2,
  Pencil,
  Plus,
  ShieldCheck,
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
    .regex(/^\d+$/, "TTL must be a number"),
});

type RecordFormValues = z.infer<typeof recordSchema>;

const typeHelp: Record<RecordFormValues["type"], string> = {
  A: "IPv4 address, e.g. 192.0.2.1",
  AAAA: "IPv6 address, e.g. 2001:db8::1",
  CNAME: "Target hostname, e.g. host.example.net.",
};

function RecordTypeBadge({ type }: { type: DnsRecordRow["type"] }) {
  const styles: Record<DnsRecordRow["type"], string> = {
    A: "bg-sky-50 text-sky-700 ring-sky-600/20",
    AAAA: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
    CNAME: "bg-amber-50 text-amber-700 ring-amber-600/20",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-xs font-semibold ring-1 ring-inset ${styles[type]}`}
    >
      {type}
    </span>
  );
}

function formatName(name: string, domain: string) {
  if (name === "@" || name === "") return domain;
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const form = useForm<RecordFormValues>({
    resolver: zodResolver(recordSchema),
    defaultValues: { type: "A", name: "@", value: "", ttl: "300" },
  });

  const watchType = useWatch({ control: form.control, name: "type" });

  const onSubmit = async (values: RecordFormValues) => {
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
    setSuccessMessage("Record added.");
    form.reset({ type: values.type, name: "@", value: "", ttl: "300" });
    router.refresh();
  };

  const onEditStart = (record: DnsRecordRow) => {
    setEditingId(record.id);
    setActionError(null);
    setSuccessMessage(null);
    form.reset({
      type: record.type,
      name: record.name,
      value: record.value,
      ttl: String(record.ttl),
    });
  };

  const onEditSubmit = async (values: RecordFormValues) => {
    if (!editingId) return;
    setActionError(null);
    setSuccessMessage(null);
    const result = await updateDnsRecord(editingId, site.id, {
      type: values.type,
      name: values.name,
      value: values.value,
      ttl: Number(values.ttl),
    });
    if (!result.ok) {
      setActionError(result.error);
      return;
    }
    setEditingId(null);
    setSuccessMessage("Record updated.");
    router.refresh();
  };

  const onDelete = async (record: DnsRecordRow) => {
    setDeletingId(record.id);
    setActionError(null);
    setSuccessMessage(null);
    const result = await deleteDnsRecord(record.id, site.id);
    setDeletingId(null);
    if (!result.ok) {
      setActionError(result.error);
      return;
    }
    setSuccessMessage("Record deleted.");
    router.refresh();
  };

  const isEditing = editingId !== null;

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
          <Link
            href="/user/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">DNS Configuration</h1>
          <p className="flex items-center gap-1.5 text-sm text-slate-600">
            <span className="font-mono font-medium text-slate-900">
              {site.domain}
            </span>
            <span className="inline-flex items-center gap-1 text-emerald-600">
              <ShieldCheck className="h-3.5 w-3.5" />
              Verified
            </span>
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[340px_1fr]">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {isEditing ? (
                  <Pencil className="h-4 w-4" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {isEditing ? "Edit Record" : "Add a Record"}
              </CardTitle>
              <CardDescription>
                {isEditing
                  ? "Update the details of this record."
                  : "Create an A, AAAA or CNAME record."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(
                    isEditing ? onEditSubmit : onSubmit,
                  )}
                  className="flex flex-col gap-4"
                >
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="A">A</SelectItem>
                              <SelectItem value="AAAA">AAAA</SelectItem>
                              <SelectItem value="CNAME">CNAME</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="@"
                            spellCheck={false}
                            {...field}
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          {field.value === "@" || field.value === ""
                            ? site.domain
                            : `${field.value}.${site.domain}`}
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Value</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={typeHelp[watchType]}
                            spellCheck={false}
                            {...field}
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          {typeHelp[watchType]}
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ttl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>TTL (seconds)</FormLabel>
                        <FormControl>
                          <Input
                            inputMode="numeric"
                            placeholder="300"
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
                  {successMessage && (
                    <p className="text-sm font-medium text-emerald-600">
                      {successMessage}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={form.formState.isSubmitting}
                    >
                      {form.formState.isSubmitting && (
                        <Loader2 className="animate-spin" />
                      )}
                      {isEditing ? "Save Changes" : "Add Record"}
                    </Button>
                    {isEditing && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setEditingId(null);
                          setActionError(null);
                          form.reset({
                            type: "A",
                            name: "@",
                            value: "",
                            ttl: "300",
                          });
                        }}
                      >
                        <X />
                      </Button>
                    )}
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Records</CardTitle>
              <CardDescription>
                {records.length === 0
                  ? "No records yet. Add your first record."
                  : `${records.length} record${records.length === 1 ? "" : "s"} for this site.`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {records.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  No DNS records configured.
                </p>
              ) : (
                <div className="overflow-hidden rounded-lg border border-slate-200">
                  <table className="w-full text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-3 py-2 font-medium">Type</th>
                        <th className="px-3 py-2 font-medium">Name</th>
                        <th className="px-3 py-2 font-medium">Value</th>
                        <th className="px-3 py-2 font-medium">TTL</th>
                        <th className="px-3 py-2" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {records.map((record) => (
                        <tr key={record.id}>
                          <td className="px-3 py-2">
                            <RecordTypeBadge type={record.type} />
                          </td>
                          <td className="px-3 py-2 font-mono text-slate-900">
                            {formatName(record.name, site.domain)}
                          </td>
                          <td className="px-3 py-2 font-mono text-slate-700">
                            {record.value}
                          </td>
                          <td className="px-3 py-2 text-slate-500">
                            {record.ttl}s
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="outline"
                                size="icon-sm"
                                onClick={() => onEditStart(record)}
                                disabled={deletingId === record.id}
                                aria-label="Edit record"
                              >
                                <Pencil />
                              </Button>
                              <Button
                                variant="destructive"
                                size="icon-sm"
                                onClick={() => onDelete(record)}
                                disabled={deletingId === record.id}
                                aria-label="Delete record"
                              >
                                {deletingId === record.id ? (
                                  <Loader2 className="animate-spin" />
                                ) : (
                                  <Trash2 />
                                )}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
