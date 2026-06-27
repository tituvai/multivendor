"use client";
import { Suspense, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import toast from "react-hot-toast";
import { Button, Input, PageLoader } from "@/components/ui";

function RegisterForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const { register: authRegister, isLoading, error } = useAuth();
  const [role, setRole] = useState("customer"); // "customer" | "vendor"

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch("password");

  const onSubmit = async (data) => {
    const payload = { ...data, role };
    const result = await authRegister(payload, redirectTo || undefined);
    if (result.success) {
      toast.success(
        role === "vendor"
          ? "Shop account created! Awaiting admin approval."
          : "Account created successfully!"
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-4xl">🛍️</span>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">MultiVendor</h1>
          <p className="text-gray-500 text-sm mt-1">Create your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg mb-5">
              {error}
            </div>
          )}

          {/* Role toggle */}
          <div className="grid grid-cols-2 gap-2 bg-gray-50 p-1 rounded-lg mb-6">
            <button
              type="button"
              onClick={() => setRole("customer")}
              className={`py-2 text-sm font-medium rounded-md transition-colors ${
                role === "customer"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Shop here
            </button>
            <button
              type="button"
              onClick={() => setRole("vendor")}
              className={`py-2 text-sm font-medium rounded-md transition-colors ${
                role === "vendor"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Sell here
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Full name"
              type="text"
              placeholder="Rahim Uddin"
              error={errors.name?.message}
              {...register("name", {
                required: "Name is required",
                minLength: { value: 2, message: "Name must be at least 2 characters" },
                maxLength: { value: 50, message: "Name cannot exceed 50 characters" },
              })}
            />

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

            <Input
              label="Phone (optional)"
              type="tel"
              placeholder="01XXXXXXXXX"
              error={errors.phone?.message}
              {...register("phone")}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register("password", {
                  required: "Password is required",
                  minLength: { value: 6, message: "At least 6 characters" },
                })}
              />
              <Input
                label="Confirm password"
                type="password"
                placeholder="••••••••"
                error={errors.confirmPassword?.message}
                {...register("confirmPassword", {
                  required: "Please confirm your password",
                  validate: (value) => value === password || "Passwords don't match",
                })}
              />
            </div>

            {role === "vendor" && (
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide pt-3">
                  Shop details
                </p>

                <Input
                  label="Shop name"
                  type="text"
                  placeholder="e.g. Anika's Fabrics"
                  error={errors.shopName?.message}
                  {...register("shopName", {
                    required: role === "vendor" ? "Shop name is required" : false,
                  })}
                />

                <Input
                  label="Shop description (optional)"
                  type="text"
                  placeholder="What do you sell?"
                  error={errors.shopDescription?.message}
                  {...register("shopDescription")}
                />

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Shop phone (optional)"
                    type="tel"
                    placeholder="01XXXXXXXXX"
                    error={errors.shopPhone?.message}
                    {...register("shopPhone")}
                  />
                  <Input
                    label="Shop email (optional)"
                    type="email"
                    placeholder="shop@example.com"
                    error={errors.shopEmail?.message}
                    {...register("shopEmail")}
                  />
                </div>

                <Input
                  label="Shop address (optional)"
                  type="text"
                  placeholder="Street, area, city"
                  error={errors.shopAddress?.message}
                  {...register("shopAddress")}
                />

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="NID number (optional)"
                    type="text"
                    placeholder="National ID"
                    error={errors.nidNumber?.message}
                    {...register("nidNumber")}
                  />
                  <Input
                    label="Trade license (optional)"
                    type="text"
                    placeholder="License number"
                    error={errors.tradeLicense?.message}
                    {...register("tradeLicense")}
                  />
                </div>

                <p className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                  Your shop will be reviewed before it goes live. This usually takes 1–2 business days.
                </p>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              size="lg"
              loading={isLoading}
            >
              {role === "vendor" ? "Create shop account" : "Create account"}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-blue-600 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <RegisterForm />
    </Suspense>
  );
}