"use client";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { loginUser, logoutUser, fetchMe, clearError, selectAuth, selectUser, selectUserRole } from "@/redux/slices/authSlice";

export const useAuth = () => {
  const dispatch = useDispatch();
  const router   = useRouter();
  const auth     = useSelector(selectAuth);
  const user     = useSelector(selectUser);
  const role     = useSelector(selectUserRole);

  const login = async (data) => {
    const res = await dispatch(loginUser(data));
    if (loginUser.fulfilled.match(res)) {
      const r = res.payload.user.role;
      if      (r === "admin")  router.push("/admin/dashboard");
      else if (r === "vendor") router.push("/vendor/dashboard");
      else                     router.push("/");
      return { success: true };
    }
    return { success: false, message: res.payload };
  };

  const logout = async () => {
    await dispatch(logoutUser());
    router.push("/auth/login");
  };

  const loadUser = () => dispatch(fetchMe());

  return {
    user,
    role,
    isLoggedIn:   !!user,
    isAdmin:      role === "admin",
    isVendor:     role === "vendor",
    isCustomer:   role === "customer",
    isLoading:    auth.isLoading,
    error:        auth.error,
    initialized:  auth.initialized,
    login,
    logout,
    loadUser,
    clearError:   () => dispatch(clearError()),
  };
};