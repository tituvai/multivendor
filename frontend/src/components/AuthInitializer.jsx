"use client";
import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { useAuth } from "@/hooks/useAuth";
import { setInitialized } from "@/redux/slices/authSlice";
import Cookies from "js-cookie";

export default function AuthInitializer({ children }) {
  const dispatch = useDispatch();
  const { loadUser, initialized } = useAuth();
  const hasInit = useRef(false);

  useEffect(() => {
    if (hasInit.current) return;
    hasInit.current = true;

    const token = Cookies.get("accessToken");
    if (token && !initialized) {
      loadUser();
    } else if (!token) {
      dispatch(setInitialized());
    }
  }, [dispatch, initialized, loadUser]);

  return <>{children}</>;
}
