"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { registerUser } from "@/app/services/auth.service";
import { useAuthStore } from "@/app/store/auth.store";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { getErrorMessage } from "@/app/utils/error-handler";
import { PublicRoute } from "@/app/components/auth/public-route";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";

const registerSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    mode: "onSubmit",
  });

  const setAuth = useAuthStore((state) => state.setAuth);

  const onSubmit = async (data: RegisterForm) => {
    try {
      const res = await registerUser(data);

      setAuth(res.data);
      toast.success("Account created successfully 🎉");

      window.location.href = "/dashboard";
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <PublicRoute>
      <div className="w-full max-w-md mx-auto bg-white border border-border shadow-md p-8 rounded-3xl">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-semibold text-center mb-8">
            Create Account
          </h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-muted mb-1.5">
                Name
              </label>
              <Input
                {...register("name")}
                placeholder="Enter your full name"
                error={errors.name?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-1.5">
                Email
              </label>
              <Input
                {...register("email")}
                type="email"
                placeholder="Enter your email"
                error={errors.email?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-1.5">
                Password
              </label>
              <Input
                type="password"
                {...register("password")}
                placeholder="Create a strong password"
                error={errors.password?.message}
              />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <p className="text-sm text-center text-muted mt-8">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-primary hover:underline font-medium"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </PublicRoute>
  );
}
