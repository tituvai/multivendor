"use client";
import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import Cookies from "js-cookie";

export default function AuthInitializer({ children }) {
  const { loadUser, initialized, isLoggedIn } = useAuth();
  const hasInit = useRef(false);

  useEffect(() => {
    if (!hasInit.current) {
      hasInit.current = true;
      const token = Cookies.get("accessToken");
      
      if (token && !initialized) {
        loadUser();
      }
    }
  }, []);

  return <>{children}</>;
}
