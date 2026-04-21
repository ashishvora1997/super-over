"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";

import { loginUser } from "@/app/services/auth.service";
import { useAuthStore } from "@/app/store/auth.store";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { getErrorMessage } from "@/app/utils/error-handler";
import { PublicRoute } from "@/app/components/auth/public-route";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email")
    .max(100, "Email cannot exceed 100 characters"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();

  const onSubmit = async (data: LoginForm) => {
    try {
      const res = await loginUser(data);

      setAuth(res.data);
      toast.success("Welcome back 👋");

      window.location.href = "/dashboard";
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <PublicRoute>
      <div className="w-full max-w-md mx-auto bg-white border border-border shadow-sm p-8 rounded-2xl">
        <h1 className="text-3xl font-semibold text-center mb-8">
          Welcome Back
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Input
              {...register("email")}
              label="Email"
              required
              type="email"
              placeholder="Enter your email"
              error={errors.email?.message}
            />
          </div>

          <div>
            <div className="flex justify-end items-center mb-1.5">
              <Link
                href="/forgot-password"
                className="text-sm text-primary hover:underline -mb-6 relative z-10"
              >
                Forgot?
              </Link>
            </div>

            <Input
              type="password"
              label="Password"
              required
              {...register("password")}
              placeholder="Enter your password"
              error={errors.password?.message}
            />
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Logging in..." : "Login"}
          </Button>
        </form>

        <p className="text-sm text-center text-muted mt-8">
          Don’t have an account?{" "}
          <Link
            href="/register"
            className="text-primary hover:underline font-medium"
          >
            Register
          </Link>
        </p>
      </div>
    </PublicRoute>
  );
}
