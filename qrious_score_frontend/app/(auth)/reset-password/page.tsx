"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { resetPassword } from "@/app/services/auth.service";
import toast from "react-hot-toast";
import { getErrorMessage } from "@/app/utils/error-handler";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

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
      toast.error("Invalid reset link");
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

      // Redirect to login after success
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (error: any) {
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
          <input
            type="password"
            {...register("password")}
            className={`w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 transition-all ${
              errors.password
                ? "border-destructive focus:ring-destructive"
                : "border-border focus:ring-primary"
            }`}
            placeholder="Enter new password"
          />
          {errors.password && (
            <p className="text-destructive text-sm mt-1.5 font-medium">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-muted mb-1.5">
            Confirm Password
          </label>
          <input
            type="password"
            {...register("confirmPassword")}
            className={`w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 transition-all ${
              errors.confirmPassword
                ? "border-destructive focus:ring-destructive"
                : "border-border focus:ring-primary"
            }`}
            placeholder="Confirm your password"
          />
          {errors.confirmPassword && (
            <p className="text-destructive text-sm mt-1.5 font-medium">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary hover:bg-primary-dark active:scale-[0.98] text-white py-3.5 rounded-2xl font-semibold transition-all disabled:opacity-70"
        >
          {isSubmitting ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
}
