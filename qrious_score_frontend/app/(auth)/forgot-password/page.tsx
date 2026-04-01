"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { forgotPassword } from "@/app/services/auth.service";
import toast from "react-hot-toast";
import { getErrorMessage } from "@/app/utils/error-handler";
import Link from "next/link";

const forgotSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email"),
});

type ForgotForm = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotForm) => {
    try {
      const res = await forgotPassword(data);

      toast.success("Check your email for reset link 📩");
      reset();
    } catch (error: any) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white border border-border shadow-sm p-8 rounded-2xl">
      {/* Title */}
      <h1 className="text-3xl font-semibold text-center mb-4">
        Forgot Password
      </h1>

      <p className="text-sm text-muted text-center mb-6">
        Enter your email and we’ll send you a reset link
      </p>

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

        {/* Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary hover:bg-primary-dark active:scale-[0.98] text-white py-3.5 rounded-2xl font-semibold transition-all disabled:opacity-70"
        >
          {isSubmitting ? "Sending..." : "Send Reset Link"}
        </button>
      </form>

      {/* Footer */}
      <p className="text-sm text-center text-muted mt-8">
        Remember your password?{" "}
        <Link
          href="/login"
          className="text-primary hover:underline font-medium"
        >
          Login
        </Link>
      </p>
    </div>
  );
}
