"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function TokenHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const processedRef = useRef(false);

  useEffect(() => {
    // Only process once per mount
    if (processedRef.current) return;

    const token = searchParams.get("token");

    if (token) {
      processedRef.current = true;
      
      // Verify token and get user info
      const verifyAndLogin = async () => {
        try {
          const response = await fetch(`/api/auth/verify-token?token=${encodeURIComponent(token)}`);
          const data = await response.json();

          if (data.success && data.data) {
            // Store user data and token in localStorage
            localStorage.setItem("authToken", data.data.token);
            localStorage.setItem(
              "user",
              JSON.stringify({
                userId: data.data.userId,
                email: data.data.email,
                name: data.data.name,
                role: data.data.role,
              })
            );
            localStorage.setItem("authType", "token");

            // Remove token from URL
            const newUrl = window.location.pathname;
            window.history.replaceState({}, "", newUrl);

            // Redirect based on role
            if (data.data.role === "Manager" || data.data.role === "Admin") {
              router.push("/manager");
            } else {
              router.push("/dashboard");
            }
          } else {
            // Token is invalid, remove it from URL
            const newUrl = window.location.pathname;
            window.history.replaceState({}, "", newUrl);
            console.error("Token verification failed:", data.error);
          }
        } catch (error) {
          console.error("Error verifying token:", error);
          // Remove token from URL even on error
          const newUrl = window.location.pathname;
          window.history.replaceState({}, "", newUrl);
        }
      };

      verifyAndLogin();
    }
  }, [searchParams, router]);

  return null; // This component doesn't render anything
}
