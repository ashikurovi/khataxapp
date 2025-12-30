"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { GoogleLoginButton } from "@/components/auth/google-login-button";
import { Navbar } from "@/components/layout/navbar";
import { 
  Calculator, 
  Calendar, 
  FileText, 
  Mail, 
  Users, 
  ArrowRight,
  CheckCircle2
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const features = [
    {
      icon: Calculator,
      title: "Expense Tracking",
      description: "Track daily expenses, deposits, and balances automatically",
    },
    {
      icon: Calendar,
      title: "Auto Bazar Schedule",
      description: "Automatically generate bazar schedules with 4-day gaps, skipping semester breaks",
    },
    {
      icon: FileText,
      title: "PDF Invoices",
      description: "Generate and download professional PDF invoices for members",
    },
    {
      icon: Mail,
      title: "Email Notifications",
      description: "Send bulk invoices via email with attachments to all members",
    },
    {
      icon: Users,
      title: "Member Management",
      description: "Manage member registrations, deposits, and financial records",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Navigation */}
      <Navbar showLoginButton={true} transparent={true} />

      {/* Hero Section */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1
            className={`text-5xl md:text-6xl font-bold mb-6 transition-all duration-1000 ${
              mounted
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
          >
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Mess Management
            </span>
            <br />
            <span className="text-slate-800 dark:text-slate-200">
              Made Simple
            </span>
          </h1>
          <p
            className={`text-xl md:text-2xl text-slate-600 dark:text-slate-300 mb-8 transition-all duration-1000 delay-200 ${
              mounted
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
          >
            Complete SaaS solution for managing mess expenses and bazar schedules
          </p>
          <div
            className={`flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 transition-all duration-1000 delay-400 ${
              mounted
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
          >
            <GoogleLoginButton />
            <Button
              variant="outline"
              size="lg"
              onClick={() => router.push("/auth/login")}
              className="group"
            >
              Manager Access
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <h2
          className={`text-3xl md:text-4xl font-bold text-center mb-4 transition-all duration-1000 delay-600 ${
            mounted
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-10"
          }`}
        >
          Powerful Features
        </h2>
        <p
          className={`text-center text-slate-600 dark:text-slate-300 mb-12 transition-all duration-1000 delay-700 ${
            mounted
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-10"
          }`}
        >
          Everything you need to manage your mess efficiently
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className={`bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-slate-200 dark:border-slate-700 ${
                  mounted
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-10"
                }`}
                style={{
                  transitionDelay: `${800 + index * 100}ms`,
                }}
              >
                <div className="bg-blue-100 dark:bg-blue-900 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-slate-800 dark:text-slate-200">
                  {feature.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-2xl p-8 md:p-12 shadow-2xl border border-slate-200 dark:border-slate-700">
          <h2
            className={`text-3xl md:text-4xl font-bold text-center mb-8 transition-all duration-1000 delay-1000 ${
              mounted
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
          >
            Why Choose KhataX?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              "Automated expense calculation",
              "Auto-generated bazar schedules",
              "PDF invoice generation",
              "Email notifications",
              "Real-time balance tracking",
              "Member management system",
              "Manager dashboard",
              "Deposit tracking",
            ].map((benefit, index) => (
              <div
                key={index}
                className={`flex items-center space-x-3 transition-all duration-1000 ${
                  mounted
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 -translate-x-10"
                }`}
                style={{
                  transitionDelay: `${1200 + index * 100}ms`,
                }}
              >
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-slate-700 dark:text-slate-300">
                  {benefit}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div
          className={`max-w-2xl mx-auto text-center transition-all duration-1000 delay-1500 ${
            mounted
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-10"
          }`}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-slate-800 dark:text-slate-200">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-8">
            Sign in with your Google account to access your dashboard
          </p>
          <GoogleLoginButton />
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200 dark:border-slate-700 mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-slate-600 dark:text-slate-400">
          <p>© 2024 KhataX. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
