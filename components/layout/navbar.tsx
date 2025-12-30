"use client";

import { Button } from "@/components/ui/button";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, LogOut, Menu, Calculator } from "lucide-react";
import { useState, useEffect } from "react";
import { GoogleLoginButton } from "@/components/auth/google-login-button";

interface NavbarProps {
  userRole?: string;
  userName?: string;
  showLoginButton?: boolean;
  transparent?: boolean;
}

interface UserData {
  userId?: string;
  email?: string;
  name?: string;
  role?: string;
}

export function Navbar({ userRole: propUserRole, userName: propUserName, showLoginButton = false, transparent = false }: NavbarProps) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | undefined>(propUserRole);
  const [userName, setUserName] = useState<string | undefined>(propUserName);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check authentication status on mount and when localStorage changes
  useEffect(() => {
    const checkAuth = () => {
      if (typeof window === "undefined") return;

      const token = localStorage.getItem("authToken");
      const userDataStr = localStorage.getItem("user");

      if (token || userDataStr) {
        setIsLoggedIn(true);
        
        if (userDataStr) {
          try {
            const userData: UserData = JSON.parse(userDataStr);
            // Only update if props not provided (to allow parent to override)
            if (!propUserRole) {
              setUserRole(userData.role || undefined);
            }
            if (!propUserName) {
              setUserName(userData.name || userData.email || undefined);
            }
          } catch (e) {
            console.error("Error parsing user data:", e);
          }
        }
      } else {
        setIsLoggedIn(false);
        // Only clear if props not provided
        if (!propUserRole) setUserRole(undefined);
        if (!propUserName) setUserName(undefined);
      }
    };

    checkAuth();

    // Listen for storage changes (e.g., when user logs in/out in another tab)
    window.addEventListener("storage", checkAuth);
    
    // Also check periodically in case of same-tab changes (e.g., after login)
    const interval = setInterval(checkAuth, 500);

    return () => {
      window.removeEventListener("storage", checkAuth);
      clearInterval(interval);
    };
  }, [propUserRole, propUserName]);

  const handleLogout = async () => {
    try {
      if (auth) {
        await signOut(auth);
      }
    } catch (e) {
      console.error("Firebase signout error:", e);
    }
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");
    localStorage.removeItem("authType");
    setIsLoggedIn(false);
    setUserRole(undefined);
    setUserName(undefined);
    router.push("/");
  };

  // Use detected auth state if props not provided
  const displayRole = propUserRole || userRole;
  const displayName = propUserName || userName;
  const showAuthButtons = isLoggedIn || !!displayRole;

  return (
    <nav className={`border-b ${transparent ? "bg-transparent border-transparent" : "bg-background"}`}>
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Calculator className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <span className={`text-xl font-bold ${transparent ? "bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent" : ""}`}>
              KhataX
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-4">
            {showAuthButtons ? (
              <>
                {displayRole === "Member" && (
                  <Link href="/dashboard">
                    <Button variant="ghost">Dashboard</Button>
                  </Link>
                )}
                {displayRole !== "Member" && (displayRole === "Manager" || displayRole === "Admin") && (
                  <>
                    <Link href="/manager">
                      <Button variant="ghost">Manager Panel</Button>
                    </Link>
                    <Link href="/manager/members">
                      <Button variant="ghost">Members</Button>
                    </Link>
                    <Link href="/manager/expenses">
                      <Button variant="ghost">Expenses</Button>
                    </Link>
                    <Link href="/manager/bazar">
                      <Button variant="ghost">Bazar</Button>
                    </Link>
                    <Link href="/manager/deposit-logs">
                      <Button variant="ghost">Deposit Logs</Button>
                    </Link>
                  </>
                )}
                {displayName && (
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span className="text-sm">{displayName}</span>
                  </div>
                )}
                <Button variant="ghost" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                {showLoginButton && (
                  <GoogleLoginButton 
                    text="Login as Member" 
                    className=""
                    variant="default"
                  />
                )}
                <Button
                  variant="ghost"
                  onClick={() => router.push("/auth/login")}
                >
                  Manager Login
                </Button>
              </>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2">
            {showAuthButtons ? (
              <>
                {displayRole === "Member" && (
                  <Link href="/dashboard" className="block">
                    <Button variant="ghost" className="w-full justify-start">
                      Dashboard
                    </Button>
                  </Link>
                )}
                {displayRole !== "Member" && (displayRole === "Manager" || displayRole === "Admin") && (
                  <>
                    <Link href="/manager" className="block">
                      <Button variant="ghost" className="w-full justify-start">
                        Manager Panel
                      </Button>
                    </Link>
                    <Link href="/manager/members" className="block">
                      <Button variant="ghost" className="w-full justify-start">
                        Members
                      </Button>
                    </Link>
                    <Link href="/manager/expenses" className="block">
                      <Button variant="ghost" className="w-full justify-start">
                        Expenses
                      </Button>
                    </Link>
                    <Link href="/manager/bazar" className="block">
                      <Button variant="ghost" className="w-full justify-start">
                        Bazar
                      </Button>
                    </Link>
                    <Link href="/manager/deposit-logs" className="block">
                      <Button variant="ghost" className="w-full justify-start">
                        Deposit Logs
                      </Button>
                    </Link>
                  </>
                )}
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                {showLoginButton && (
                  <div className="w-full">
                    <GoogleLoginButton 
                      text="Login as Member"
                      className="w-full"
                    />
                  </div>
                )}
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => router.push("/auth/login")}
                >
                  Manager Login
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

