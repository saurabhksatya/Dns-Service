import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import TwoFactorClient from "./two-factor-client";

export const dynamic = "force-dynamic";

export default async function TwoFactorPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user && session.user.twoFactorEnabled) {
    redirect("/user/dashboard");
  }

  return <TwoFactorClient />;
}
