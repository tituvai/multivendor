"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { useApplyAsVendorMutation } from "@/redux/slices/vendorsApi";
import { Button, Input, PageLoader } from "@/components/ui";

export default function VendorRegisterPage() {
  const router = useRouter();
  const { user, isLoggedIn, isVendor, initialized, loadUser } = useAuth();
  const [applyAsVendor, { isLoading }] = useApplyAsVendorMutation();
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      shopEmail: user?.email || "",
    },
  });

  useEffect(() => {
    if (!initialized) loadUser();
  }, [initialized, loadUser]);

  useEffect(() => {
    if (!initialized) return;
    if (isVendor && user?.vendorInfo?.isApproved) {
      router.replace("/vendor/dashboard");
    }
  }, [initialized, isVendor, user, router]);

  const onSubmit = async (data) => {
    if (!isLoggedIn) {
      router.push("/auth/login?redirect=/vendor/register");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("shopName", data.shopName);
      formData.append("shopDescription", data.shopDescription || "");
      formData.append("shopAddress", data.shopAddress || "");
      formData.append("shopPhone", data.shopPhone || "");
      formData.append("shopEmail", data.shopEmail || user?.email || "");
      formData.append("nidNumber", data.nidNumber || "");
      if (data.nidImage?.[0]) formData.append("nidImage", data.nidImage[0]);
      if (data.tradeLicense?.[0]) formData.append("tradeLicense", data.tradeLicense[0]);

      await applyAsVendor(formData).unwrap();
      setSubmitted(true);
      toast.success("Application submitted successfully!");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to submit application");
    }
  };

  if (!initialized) return <PageLoader />;

  if (isLoggedIn && user?.vendorInfo?.status === "pending") {
    return (
      <div className="max-w-lg mx-auto py-16 px-4 text-center">
        <div className="text-5xl mb-4">⏳</div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Application Under Review</h1>
        <p className="text-slate-500 text-sm">
          Your vendor application is being reviewed. We will notify you by email within 2–3 business days.
        </p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto py-16 px-4 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Application Submitted</h1>
        <p className="text-slate-500 text-sm mb-6">
          Thank you! Our team will review your shop details and get back to you soon.
        </p>
        <Link href="/" className="text-orange-500 font-semibold hover:underline">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <div className="mb-8 text-center">
        <span className="text-4xl">🏪</span>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">Become a Vendor</h1>
        <p className="text-slate-500 text-sm mt-1">
          Fill in your shop details to start selling on MaltiVendor
        </p>
      </div>

      {!isLoggedIn && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6 text-sm text-amber-800 dark:text-amber-200">
          You need an account to apply.{" "}
          <Link href="/auth/login?redirect=/vendor/register" className="font-semibold underline">
            Sign in
          </Link>{" "}
          or{" "}
          <Link href="/auth/register" className="font-semibold underline">
            create an account
          </Link>{" "}
          first.
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5 shadow-sm"
      >
        <Input
          label="Shop Name *"
          placeholder="My Awesome Shop"
          error={errors.shopName?.message}
          {...register("shopName", {
            required: "Shop name is required",
            minLength: { value: 3, message: "Minimum 3 characters" },
            maxLength: { value: 60, message: "Maximum 60 characters" },
          })}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
            Shop Description
          </label>
          <textarea
            rows={3}
            placeholder="Tell customers about your shop..."
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-200"
            {...register("shopDescription", { maxLength: { value: 500, message: "Max 500 characters" } })}
          />
          {errors.shopDescription && (
            <p className="mt-1 text-xs text-red-500">{errors.shopDescription.message}</p>
          )}
        </div>

        <Input
          label="Shop Address"
          placeholder="City, Country"
          {...register("shopAddress")}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Shop Phone"
            placeholder="+880 1XXX XXXXXX"
            {...register("shopPhone")}
          />
          <Input
            label="Shop Email"
            type="email"
            placeholder="shop@example.com"
            {...register("shopEmail")}
          />
        </div>

        <Input
          label="NID Number"
          placeholder="National ID number"
          {...register("nidNumber", {
            minLength: { value: 10, message: "Invalid NID number" },
            maxLength: { value: 20, message: "Invalid NID number" },
          })}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
              NID Image (optional)
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="w-full text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-orange-50 file:text-orange-600 file:font-medium"
              {...register("nidImage")}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
              Trade License (optional)
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="w-full text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-orange-50 file:text-orange-600 file:font-medium"
              {...register("tradeLicense")}
            />
          </div>
        </div>

        <Button type="submit" variant="primary" className="w-full" size="lg" loading={isLoading}>
          Submit Application
        </Button>
      </form>
    </div>
  );
}
