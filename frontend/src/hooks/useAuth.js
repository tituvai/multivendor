"use client";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import {
  loginUser,
  registerUser,
  logoutUser,
  fetchMe,
  clearError,
  selectAuth,
  selectUser,
  selectUserRole,
} from "@/redux/slices/authSlice";

const getDashboardPath = (role) => {
  const r = (role || "").toLowerCase();
  if (r === "admin") return "/admin/dashboard";
  if (r === "vendor") return "/vendor/dashboard";
  return "/";
};

export const useAuth = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const auth = useSelector(selectAuth);
  const user = useSelector(selectUser);
  const role = useSelector(selectUserRole);

  const login = async (data, redirectTo) => {
    const res = await dispatch(loginUser(data));
    if (loginUser.fulfilled.match(res)) {
      const userRole = res.payload?.user?.role;
      const destination =
        userRole === "customer" && redirectTo
          ? redirectTo
          : getDashboardPath(userRole);
      router.replace(destination);
      return { success: true, role: userRole };
    }
    return { success: false, message: res.payload };
  };

  // registerUser.fulfilled doesn't set user/accessToken in the slice
  // (no auto-login on register) — so after success we route to login,
  // optionally preserving the vendor pending-approval messaging upstream.
  const register = async (data, redirectTo) => {
    const res = await dispatch(registerUser(data));
    if (registerUser.fulfilled.match(res)) {
      const userRole = data?.role;
      const destination =
        userRole === "vendor" ? "/auth/login" : redirectTo || "/auth/login";
      router.replace(destination);
      return { success: true, role: userRole };
    }
    return { success: false, message: res.payload };
  };

  const logout = async () => {
    await dispatch(logoutUser());
    router.replace("/auth/login");
  };

  const loadUser = () => dispatch(fetchMe());

  return {
    user,
    role,
    isLoggedIn: !!user,
    isAdmin: role === "admin",
    isVendor: role === "vendor",
    isCustomer: role === "customer",
    isLoading: auth.isLoading,
    error: auth.error,
    initialized: auth.initialized,
    login,
    register,
    logout,
    loadUser,
    clearError: () => dispatch(clearError()),
    getDashboardPath,
  };
};