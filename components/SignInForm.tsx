"use client";
import * as z from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Field, FieldError, FieldGroup, FieldLabel } from "./ui/field";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { LogIn } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useState } from "react";
import { Spinner } from "./ui/spinner";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  // email: z.string().regex(/^\S+@\S+\.\S+$/, "Invalid email address"),
  username: z.string().min(1, "Username is required"),
  password: z.string(),
});

const SignInForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (formData: z.infer<typeof formSchema>) => {
    await authClient.signIn.username(
      {
        username: formData.username,
        password: formData.password,
      },
      {
        onRequest: () => {
          setIsLoading(true);
        },
        onSuccess: (ctx) => {
          const role =
            (ctx.data.user.role as string | undefined)?.toUpperCase() ??
            "CASHIER";
          toast.success(
            `Logged in successfully! Welcome back, ${ctx.data.user.username} (${role})!`,
          );
          // Cashier → POS directly, everyone else → dashboard
          if (role === "CASHIER") {
            router.push("/dashboard/pos");
          } else {
            router.push("/dashboard");
          }
        },
        onError: (ctx) => {
          toast.error(ctx.error.message || "Invalid credentials! Try again.");
          setIsLoading(false);
        },
        onSettled: () => {
          setIsLoading(false);
        },
      },
    );
  };
  return (
    <div className="w-full">
      <h1 className="text-md font-semibold my-4">Sign In to your account</h1>
      <form id="login_form" onSubmit={form.handleSubmit(onSubmit)}>
        <FieldGroup>
          <Controller
            name="username"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="username">Username</FieldLabel>
                <Input
                  {...field}
                  id="username"
                  type="text"
                  aria-invalid={fieldState.invalid}
                  placeholder="Enter your username"
                  autoComplete="off"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  {...field}
                  id="password"
                  type="password"
                  aria-invalid={fieldState.invalid}
                  placeholder="Enter your password"
                  autoComplete="off"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? <Spinner /> : <LogIn className="mr-2" size={16} />}
            {isLoading ? "Signing In..." : "Sign In"}
          </Button>
        </FieldGroup>
      </form>
    </div>
  );
};

export default SignInForm;
