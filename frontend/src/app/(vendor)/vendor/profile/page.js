"use client";
import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { vendorAPI, uploadAPI } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";
import Image from "next/image";
import { Button, Input, Textarea, Card, Spinner } from "@/components/ui";

export default function VendorProfilePage() {
  const { user, loadUser } = useAuth();
  const [loading,  setLoading]  = useState(false);
  const [avatarL,  setAvatarL]  = useState(false);
  const [bannerL,  setBannerL]  = useState(false);
  const avatarRef = useRef();
  const bannerRef = useRef();

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (user) {
      reset({
        shopName:        user.vendorInfo?.shopName,
        shopDescription: user.vendorInfo?.shopDescription,
        shopPhone:       user.vendorInfo?.shopPhone,
        shopEmail:       user.vendorInfo?.shopEmail,
        shopAddress:     user.vendorInfo?.shopAddress,
      });
    }
  }, [user]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await vendorAPI.updateProfile(data);
      await loadUser();
      toast.success("Shop profile updated!");
    } catch (e) { toast.error(e.response?.data?.message || "Failed"); }
    finally { setLoading(false); }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarL(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      await uploadAPI.avatar(fd);
      await loadUser();
      toast.success("Avatar updated!");
    } catch { toast.error("Upload failed"); }
    finally { setAvatarL(false); }
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerL(true);
    try {
      const fd = new FormData();
      fd.append("banner", file);
      await uploadAPI.shopBanner(fd);
      await loadUser();
      toast.success("Banner updated!");
    } catch { toast.error("Upload failed"); }
    finally { setBannerL(false); }
  };

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Shop Profile</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your shop's public information</p>
      </div>

      {/* Avatar & Banner */}
      <Card className="p-5 space-y-5">
        <h2 className="font-semibold text-gray-900">Shop Media</h2>

        {/* Banner */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Shop Banner</p>
          <div className="relative w-full h-36 bg-gray-100 rounded-xl overflow-hidden group cursor-pointer"
            onClick={() => bannerRef.current?.click()}>
            {user?.vendorInfo?.shopBanner
              ? <Image src={user.vendorInfo.shopBanner} alt="banner" fill className="object-cover" />
              : <div className="flex items-center justify-center h-full text-gray-300 text-4xl">🏪</div>}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
              {bannerL ? <Spinner color="white" /> : <p className="text-white text-sm font-medium">Change Banner</p>}
            </div>
          </div>
          <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 rounded-full bg-teal-100 overflow-hidden group cursor-pointer flex-shrink-0"
            onClick={() => avatarRef.current?.click()}>
            {user?.avatar
              ? <Image src={user.avatar} alt="avatar" fill className="object-cover" />
              : <div className="flex items-center justify-center h-full text-2xl font-bold text-teal-700">{user?.name?.[0]}</div>}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
              {avatarL ? <Spinner size="sm" color="white" /> : <p className="text-white text-xs">Edit</p>}
            </div>
          </div>
          <div>
            <p className="font-semibold text-gray-900">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <button onClick={() => avatarRef.current?.click()}
              className="text-xs text-teal-600 hover:underline mt-0.5">Change avatar</button>
          </div>
          <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
        </div>
      </Card>

      {/* Shop Info Form */}
      <Card className="p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Shop Information</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Shop Name *" placeholder="Your shop name"
            error={errors.shopName?.message}
            {...register("shopName", { required: "Shop name is required" })} />

          <Textarea label="Shop Description" rows={3}
            placeholder="Tell customers about your shop..."
            {...register("shopDescription")} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Shop Phone" placeholder="01700000000" {...register("shopPhone")} />
            <Input label="Shop Email" type="email" placeholder="shop@example.com" {...register("shopEmail")} />
          </div>

          <Input label="Shop Address" placeholder="Dhaka, Bangladesh" {...register("shopAddress")} />

          <Button type="submit" variant="vendor" loading={loading}>Save Changes</Button>
        </form>
      </Card>

      {/* Account Stats */}
      <Card className="p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Account Stats</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            ["Total Sales",   user?.vendorInfo?.totalSales   || 0, "🛒"],
            ["Total Revenue", `৳${(user?.vendorInfo?.totalRevenue || 0)?.toLocaleString()}`, "💰"],
            ["Products",      user?.vendorInfo?.totalProducts || 0, "📦"],
          ].map(([label, value, icon]) => (
            <div key={label} className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-2xl mb-1">{icon}</p>
              <p className="text-lg font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}