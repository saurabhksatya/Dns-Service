"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authClient } from "@/lib/authClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthNavbar } from "@/components/auth-navbar";
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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const signinSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type SigninFormValues = z.infer<typeof signinSchema>;

export default function SigninClient() {
  const router = useRouter();

  const form = useForm<SigninFormValues>({
    resolver: zodResolver(signinSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: SigninFormValues) => {
    const { data, error: signinError } = await authClient.signIn.email({
      email: values.email,
      password: values.password,
    });

    if (signinError) {
      form.setError("root", {
        message: signinError.message ?? "Invalid email or password",
      });
      return;
    }

    if (data && "twoFactorRedirect" in data && data.twoFactorRedirect) {
      router.push("/two-factor");
      return;
    }

    // Check if user has 2FA enabled; if not, enforce setup
    const session = await authClient.getSession();
    if (session?.data?.user && !session.data.user.twoFactorEnabled) {
      try {
        sessionStorage.setItem("totp_setup_pwd", values.password);
      } catch { }
      router.push("/two-factor/setup");
      return;
    }

    router.push("/user/dashboard");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AuthNavbar mode="signin" />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="mx-auto flex w-full max-w-md flex-col items-center">
          <Card className="w-full border-border/80 bg-card shadow-xl pt-6">
            <CardHeader className="space-y-1.5 pb-4 px-6">
              <CardTitle className="text-2xl font-bold tracking-tight">Sign In</CardTitle>
              <CardDescription className="text-sm">
                Enter your credentials to access your DNS zones
              </CardDescription>
            </CardHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="flex flex-col gap-4 px-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="user@example.com"
                            className="bg-background border-border/80 text-sm h-10 px-3"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            className="bg-background border-border/80 text-sm h-10 px-3"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {form.formState.errors.root && (
                    <p className="text-sm font-medium text-destructive">
                      {form.formState.errors.root.message}
                    </p>
                  )}
                  <Button
                    type="submit"
                    className="w-full bg-foreground text-background hover:opacity-90 text-sm font-medium h-10 mt-2"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting && (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    )}
                    Sign in
                  </Button>
                </CardContent>
                <CardFooter className="flex justify-center border-t border-border/60 pt-4 mt-6">
                  <p className="text-sm text-muted-foreground">
                    Don&apos;t have an account?{" "}
                    <Link
                      href="/signup"
                      className="font-medium text-foreground underline underline-offset-4 hover:text-foreground/80"
                    >
                      Sign up
                    </Link>
                  </p>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </div>
      </main>
    </div>
  );
}
