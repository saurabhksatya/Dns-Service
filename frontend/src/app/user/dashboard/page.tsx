import { redirect } from "next/navigation";
import { headers } from "next/headers";
import prisma from "@/db";
import { auth } from "@/lib/auth";
import SitesClient from "./sites-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/signin");
  }

  const sites = await prisma.site.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return <SitesClient sites={sites} />;
}
