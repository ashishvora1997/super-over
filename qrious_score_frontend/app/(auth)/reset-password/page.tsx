"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { resetPassword } from "@/app/services/auth.service";
import toast from "react-hot-toast";
import { getErrorMessage } from "@/app/utils/error-handler";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";

const resetSchema = z
  .object({
    password: z
      .string()
      .min(1, "Password is required")
      .min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetForm = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
  });

  // 🚨 If no token → redirect
  useEffect(() => {
    if (!token) {
      toast.error("Invalid or expired reset link");
      router.push("/login");
    }
  }, [token, router]);

  const onSubmit = async (data: ResetForm) => {
    if (!token) return;

    try {
      const res = await resetPassword({
        token,
        password: data.password,
      });

      toast.success(res.message);
      router.replace("/login");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white border border-border shadow-sm p-8 rounded-2xl">
      {/* Title */}
      <h1 className="text-3xl font-semibold text-center mb-4">
        Reset Password
      </h1>

      <p className="text-sm text-muted text-center mb-6">
        Enter your new password below
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-muted mb-1.5">
            New Password
          </label>
          <Input
            type="password"
            {...register("password")}
            placeholder="Enter new password"
            error={errors.password?.message}
          />
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-muted mb-1.5">
            Confirm Password
          </label>
          <Input
            type="password"
            {...register("confirmPassword")}
            placeholder="Confirm your password"
            error={errors.confirmPassword?.message}
          />
        </div>

        {/* Button */}
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Resetting..." : "Reset Password"}
        </Button>
      </form>
    </div>
  );
}
