import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import SignupClient from "./signup-client";

export const dynamic = "force-dynamic";

export default async function SignupPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user) {
    redirect("/user/dashboard");
  }

  return <SignupClient />;
}