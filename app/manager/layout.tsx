"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserRole } from "@/types";
import { Loader2 } from "lucide-react";

export default function ManagerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = () => {
            try {
                const userDataStr = localStorage.getItem("user");
                if (!userDataStr) {
                    router.push("/auth/login");
                    return;
                }

                const userData = JSON.parse(userDataStr);
                const userRole = userData.role;

                // Allow Manager and Admin/SuperAdmin to access manager routes
                if (userRole === UserRole.MANAGER) {
                    setAuthorized(true);
                } else {
                    // Redirect unauthorized users to home or dashboard
                    router.push("/");
                }
            } catch (error) {
                console.error("Auth check failed:", error);
                router.push("/auth/login");
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, [router]);

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Verifying access...</p>
                </div>
            </div>
        );
    }

    if (!authorized) {
        return null; // Will redirect in useEffect
    }

    return <div className="min-h-screen bg-gray-50">{children}</div>;
}
