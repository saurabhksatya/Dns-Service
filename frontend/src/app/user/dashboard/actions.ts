"use server";

import { headers } from "next/headers";
import prisma from "@/db";
import { auth } from "@/lib/auth";
import { Prisma } from "@/generated/prisma/client";
import { SiteStatus } from "@/generated/prisma/client";

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
  const status: "VERIFIED" | "FAILED" = success ? "VERIFIED" : "FAILED";
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
