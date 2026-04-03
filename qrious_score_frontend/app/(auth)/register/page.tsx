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

      setAuth(res);
      toast.success("Account created successfully 🎉");
      reset();

      router.push("/dashboard");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <PublicRoute>
      <div className="w-full max-w-md mx-auto bg-white border border-border shadow-md p-8 rounded-3xl">
        {/* Clean centered layout without card */}
        <div className="w-full max-w-md">
          {/* Title */}
          <h1 className="text-3xl font-semibold text-center mb-8">
            Create Account
          </h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-muted mb-1.5">
                Name
              </label>
              <input
                {...register("name")}
                className={`w-full px-4 py-3 bg-white border rounded-2xl focus:outline-none focus:ring-2 transition-all ${
                  errors.name
                    ? "border-destructive focus:ring-destructive"
                    : "border-border focus:ring-primary"
                }`}
                placeholder="Enter your full name"
              />
              {errors.name && (
                <p className="text-destructive text-sm mt-1.5 font-medium">
                  {errors.name.message}
                </p>
              )}
            </div>

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
              <label className="block text-sm font-medium text-muted mb-1.5">
                Password
              </label>
              <input
                type="password"
                {...register("password")}
                className={`w-full px-4 py-3 bg-white border rounded-2xl focus:outline-none focus:ring-2 transition-all ${
                  errors.password
                    ? "border-destructive focus:ring-destructive"
                    : "border-border focus:ring-primary"
                }`}
                placeholder="Create a strong password"
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
              {isSubmitting ? "Creating account..." : "Create Account"}
            </button>
          </form>

          {/* Footer */}
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
