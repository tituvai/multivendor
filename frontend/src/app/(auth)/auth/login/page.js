"use client";
import { useForm } from "react-hook-form";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { Button, Input } from "@/components/ui";

export default function LoginPage() {
  const { login, isLoading, error } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = (data) => login(data);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-4xl">🛍️</span>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">MultiVendor</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register("email", {
                required: "Email is required",
                pattern: { value: /^\S+@\S+\.\S+$/, message: "Invalid email" },
              })}
            />
            <div>
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register("password", { required: "Password is required" })}
              />
              <div className="mt-1.5 text-right">
                <Link href="/auth/forgot-password" className="text-xs text-blue-600 hover:underline">
                  Forgot password?
                </Link>
              </div>
            </div>
            <Button type="submit" variant="primary" className="w-full" size="lg" loading={isLoading}>
              Sign In
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{" "}
            <Link href="/auth/register" className="text-blue-600 font-medium hover:underline">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}