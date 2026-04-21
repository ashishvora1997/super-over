"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { forgotPassword } from "@/app/services/auth.service";
import toast from "react-hot-toast";
import { getErrorMessage } from "@/app/utils/error-handler";
import Link from "next/link";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";

const forgotSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email")
    .max(100, "Email cannot exceed 100 characters"),
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

      toast.success(res.message);
      reset();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white border border-border shadow-sm p-8 rounded-2xl">
      <h1 className="text-3xl font-semibold text-center mb-4">
        Forgot Password
      </h1>

      <p className="text-sm text-muted text-center mb-6">
        Enter your email and we’ll send you a reset link
      </p>

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

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Sending..." : "Send Reset Link"}
        </Button>
      </form>

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
