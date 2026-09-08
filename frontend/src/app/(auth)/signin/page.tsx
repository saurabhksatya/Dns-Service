import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import SigninClient from "./signin-client";

export const dynamic = "force-dynamic";

export default async function SigninPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user) {
    redirect("/user/dashboard");
  }

  return <SigninClient />;
}
