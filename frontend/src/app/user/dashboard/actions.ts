"use server";

import { headers } from "next/headers";
import prisma from "@/db";
import { auth } from "@/lib/auth";
import { Prisma, SiteStatus, DnsRecordType } from "@/generated/prisma/client";

const BACKEND_URL = "http://localhost:8000";

type ActionResult = { ok: true } | { ok: false; error: string };
type VerifyResult =
  | { ok: true; status: "VERIFIED" | "FAILED"; error?: string }
  | { ok: false; error: string };

async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return null;
  return session;
}

function normalizeDomain(input: string): string | null {
  let domain = input.trim();
  if (!domain) return null;
  domain = domain.replace(/^https?:\/\//i, "");
  domain = domain.replace(/\/+$/, "");
  domain = domain.split("/")[0];
  if (!domain) return null;
  return domain;
}

async function checkNS(
  domain: string,
): Promise<{ success: boolean; message?: string }> {
  // const url = `${BACKEND_URL}/checkNS/${encodeURIComponent(domain)}`;
  const url = `${BACKEND_URL}/test/${encodeURIComponent(domain)}.`;
  const res = await fetch(url, { method: "GET" });
  const data = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    message?: string;
  };
  if (!res.ok || !data.success) {
    return {
      success: false,
      message: data.message ?? `Verification failed (HTTP ${res.status})`,
    };
  }
  return { success: true, message: data.message };
}

export async function addSite(domain: string): Promise<ActionResult> {
  const session = await getSessionUser();
  if (!session) {
    return { ok: false, error: "You must be signed in to add a site." };
  }
  const normalized = normalizeDomain(domain);
  if (!normalized) {
    return { ok: false, error: "A valid domain is required." };
  }
  try {
    await prisma.site.create({
      data: {
        userId: session.user.id,
        domain: normalized,
        status: SiteStatus.PENDING,
      },
    });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return { ok: false, error: "You have already added this domain." };
    }
    return { ok: false, error: "Failed to add site. Please try again." };
  }
  return { ok: true };
}

export async function verifySite(siteId: string): Promise<VerifyResult> {
  const session = await getSessionUser();
  if (!session) {
    return { ok: false, error: "You must be signed in to verify a site." };
  }
  const site = await prisma.site.findUnique({ where: { id: siteId } });
  if (!site) {
    return { ok: false, error: "Site not found." };
  }
  if (site.userId !== session.user.id) {
    return { ok: false, error: "You do not own this site." };
  }
  let success = false;
  let message: string | undefined;
  try {
    const result = await checkNS(site.domain);
    success = result.success;
    message = result.message;
  } catch {
    success = false;
    message =
      "Could not reach the verification backend. Please try again later.";
  }
  await prisma.site.update({
    where: { id: siteId },
    data: {
      status: success ? SiteStatus.VERIFIED : SiteStatus.FAILED,
      failReason: success ? null : (message ?? null),
      lastChecked: new Date(),
    },
  });
  if (success) {
    return { ok: true, status: "VERIFIED" };
  }
  return { ok: true, status: "FAILED", error: message };
}

export async function deleteSite(siteId: string): Promise<ActionResult> {
  const session = await getSessionUser();
  if (!session) {
    return { ok: false, error: "You must be signed in to delete a site." };
  }
  const site = await prisma.site.findUnique({ where: { id: siteId } });
  if (!site) {
    return { ok: false, error: "Site not found." };
  }
  if (site.userId !== session.user.id) {
    return { ok: false, error: "You do not own this site." };
  }
  await prisma.site.delete({ where: { id: siteId } });
  return { ok: true };
}

export type DnsRecordRow = {
  id: string;
  siteId: string;
  type: "A" | "AAAA" | "CNAME";
  name: string;
  value: string;
  ttl: number;
  createdAt: Date;
  updatedAt: Date;
};

type DnsRecordActionResult =
  | { ok: true; record: DnsRecordRow }
  | { ok: false; error: string };

async function getSiteOwnership(siteId: string) {
  const session = await getSessionUser();
  if (!session) return { session: null, site: null };
  const site = await prisma.site.findUnique({ where: { id: siteId } });
  if (!site || site.userId !== session.user.id) return { session, site: null };
  return { session, site };
}

export async function addDnsRecord(
  siteId: string,
  data: {
    type: "A" | "AAAA" | "CNAME";
    name: string;
    value: string;
    ttl?: number;
  },
): Promise<DnsRecordActionResult> {
  const { session, site } = await getSiteOwnership(siteId);
  if (!session) return { ok: false, error: "You must be signed in." };
  if (!site) return { ok: false, error: "Site not found." };
  if (site.status !== "VERIFIED")
    return { ok: false, error: "Site must be verified to manage DNS records." };

  try {
    const record = await prisma.dnsRecord.create({
      data: {
        siteId,
        type: data.type as unknown as DnsRecordType,
        name: data.name.trim(),
        value: data.value.trim(),
        ttl: data.ttl ?? 300,
      },
    });
    return { ok: true, record: record as unknown as DnsRecordRow };
  } catch {
    return { ok: false, error: "Failed to create DNS record." };
  }
}

export async function updateDnsRecord(
  recordId: string,
  siteId: string,
  data: {
    type: "A" | "AAAA" | "CNAME";
    name: string;
    value: string;
    ttl?: number;
  },
): Promise<DnsRecordActionResult> {
  const { session, site } = await getSiteOwnership(siteId);
  if (!session) return { ok: false, error: "You must be signed in." };
  if (!site) return { ok: false, error: "Site not found." };
  if (site.status !== "VERIFIED")
    return { ok: false, error: "Site must be verified to manage DNS records." };

  try {
    const record = await prisma.dnsRecord.update({
      where: { id: recordId },
      data: {
        type: data.type as unknown as DnsRecordType,
        name: data.name.trim(),
        value: data.value.trim(),
        ttl: data.ttl ?? 300,
      },
    });
    return { ok: true, record: record as unknown as DnsRecordRow };
  } catch {
    return { ok: false, error: "Failed to update DNS record." };
  }
}

export async function deleteDnsRecord(
  recordId: string,
  siteId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { session, site } = await getSiteOwnership(siteId);
  if (!session) return { ok: false, error: "You must be signed in." };
  if (!site) return { ok: false, error: "Site not found." };

  try {
    await prisma.dnsRecord.delete({ where: { id: recordId } });
    return { ok: true };
  } catch {
    return { ok: false, error: "Failed to delete DNS record." };
  }
}
