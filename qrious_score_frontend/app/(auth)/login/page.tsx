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

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email"),
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

      setAuth(res);
      toast.success("Welcome back 👋");
      reset();

      router.push("/dashboard");
    } catch (error: any) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <PublicRoute>
      <div className="w-full max-w-md mx-auto bg-white border border-border shadow-sm p-8 rounded-2xl">
        {/* Title */}
        <h1 className="text-3xl font-semibold text-center mb-8">
          Welcome Back
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-muted mb-1.5">
              Email
            </label>
            <input
              {...register("email")}
              type="email"
              className={`w-full px-4 py-3 bg-white border rounded-2xl focus:outline-none focus:ring-2 transition-all ${
                errors.email
                  ? "border-destructive focus:ring-destructive"
                  : "border-border focus:ring-primary"
              }`}
              placeholder="Enter your email"
            />
            {errors.email && (
              <p className="text-destructive text-sm mt-1.5 font-medium">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-sm font-medium text-muted">Password</label>
              <Link
                href="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Forgot?
              </Link>
            </div>

            <input
              type="password"
              {...register("password")}
              className={`w-full px-4 py-3 bg-white border rounded-2xl focus:outline-none focus:ring-2 transition-all ${
                errors.password
                  ? "border-destructive focus:ring-destructive"
                  : "border-border focus:ring-primary"
              }`}
              placeholder="Enter your password"
            />

            {errors.password && (
              <p className="text-destructive text-sm mt-1.5 font-medium">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary hover:bg-primary-dark active:scale-[0.98] text-white py-3.5 rounded-2xl font-semibold transition-all disabled:opacity-70"
          >
            {isSubmitting ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Footer */}
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
