import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import SetupClient from "./setup-client";

export const dynamic = "force-dynamic";

export default async function TwoFactorSetupPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/signin");
  }
  if (session.user.twoFactorEnabled) {
    redirect("/user/dashboard");
  }

  return <SetupClient userEmail={session.user.email} />;
}
