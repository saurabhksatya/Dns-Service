import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import prisma from "@/db";
import { auth } from "@/lib/auth";
import DnsRecordsClient from "./dns-records-client";
import type { SiteRow } from "../../dashboard/sites-client";

export const dynamic = "force-dynamic";

export default async function SiteConfigPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/signin");
  }

  const site = await prisma.site.findUnique({ where: { id: siteId } });
  if (!site || site.userId !== session.user.id) {
    notFound();
  }

  const records = await prisma.dnsRecord.findMany({
    where: { siteId },
    orderBy: { createdAt: "asc" },
  });

  return (
    <DnsRecordsClient
      site={
        {
          id: site.id,
          domain: site.domain,
          status: site.status,
          lastChecked: site.lastChecked,
          failReason: site.failReason,
          createdAt: site.createdAt,
        } satisfies SiteRow
      }
      records={
        records.map((r) => ({
          id: r.id,
          siteId: r.siteId,
          type: r.type,
          name: r.name,
          value: r.value,
          ttl: r.ttl,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        }))
      }
    />
  );
}
