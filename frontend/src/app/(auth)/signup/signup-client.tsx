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

const signupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters"),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupClient() {
  const router = useRouter();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = async (values: SignupFormValues) => {
    const { error: signupError } = await authClient.signUp.email({
      email: values.email,
      password: values.password,
      name: values.name,
    });

    if (signupError) {
      form.setError("root", {
        message: signupError.message ?? "Signup failed",
      });
      return;
    }

    try {
      sessionStorage.setItem("totp_setup_pwd", values.password);
    } catch { }

    router.push("/two-factor/setup");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AuthNavbar mode="signup" />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="mx-auto flex w-full max-w-md flex-col items-center">
          <Card className="w-full border-border/80 bg-card shadow-xl">
            <CardHeader className="space-y-1.5 pb-4 px-4 sm:px-6">
              <CardTitle className="text-2xl font-bold tracking-tight">
                Create Account
              </CardTitle>
              <CardDescription className="text-sm">
                Sign up to start hosting authoritative DNS zones
              </CardDescription>
            </CardHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="flex flex-col gap-4 px-4 sm:px-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="John Doe"
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
                            placeholder="••••••••"
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
                    Sign Up
                  </Button>
                </CardContent>
                <CardFooter className="flex justify-center border-t border-border/60 pt-4 mt-6">
                  <p className="text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link
                      href="/signin"
                      className="font-medium text-foreground underline underline-offset-4 hover:text-foreground/80"
                    >
                      Sign in
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
