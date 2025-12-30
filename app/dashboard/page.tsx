"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import { apiClient } from "@/lib/api-client";
import { MemberWithUser, DepositLogWithUser } from "@/types";
import { Download, Wallet, TrendingUp, TrendingDown, DollarSign, History, Clock, Receipt, Calculator, Trash2 } from "lucide-react";
import { PDFGenerator } from "@/lib/pdf-generator";
import { DepositLogTable } from "@/components/tables/deposit-log-table";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function DashboardPage() {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  const [showResetDialog, setShowResetDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: memberData, isLoading } = useQuery({
    queryKey: ["member-dashboard"],
    queryFn: async () => {
      const response = await apiClient.get<MemberWithUser>("/members/me");
      return response.data;
    },
  });

  const { data: depositLogs, isLoading: depositLogsLoading } = useQuery({
    queryKey: ["deposit-logs", memberData?.userId, currentMonth, currentYear],
    queryFn: async () => {
      if (!memberData) return [];
      const params = new URLSearchParams();
      params.append("userId", memberData.userId);
      params.append("month", currentMonth.toString());
      params.append("year", currentYear.toString());
      
      const response = await apiClient.get<DepositLogWithUser[]>(
        `/heshab/deposit-logs?${params.toString()}`
      );
      return response.data || [];
    },
    enabled: !!memberData,
  });

  const handleDownloadInvoice = () => {
    if (!memberData) return;

    const currentDate = new Date();
    const invoiceData = {
      member: memberData,
      month: currentDate.getMonth() + 1,
      year: currentDate.getFullYear(),
      transactions: [],
      totalDeposit: memberData.totalDeposit,
      totalExpense: memberData.totalExpense,
      balance: memberData.balanceDue,
      border: memberData.border,
      managerReceivable: memberData.managerReceivable,
    };

    const pdf = PDFGenerator.generateInvoice(invoiceData);
    pdf.save(`invoice-${memberData.user.name}-${currentDate.getMonth() + 1}-${currentDate.getFullYear()}.pdf`);
  };

  const resetDbMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post("/reset-db");
      if (!response.success) {
        throw new Error(response.error || "Failed to reset database");
      }
      return response;
    },
    onSuccess: () => {
      setShowResetDialog(false);
      // Invalidate all queries to refresh data
      queryClient.invalidateQueries();
      // Show success message
      alert("Database reset successfully! All data has been cleared.");
      // Optionally redirect or reload
      window.location.href = "/";
    },
    onError: (error: Error) => {
      alert(`Error: ${error.message}`);
    },
  });

  const handleResetDb = () => {
    resetDbMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!memberData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card className="bg-white/80 backdrop-blur-lg border-white/20 shadow-lg">
            <CardContent className="pt-6">
              <p className="text-gray-600">No member data found. Please contact the manager.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <Navbar userRole="Member" userName={memberData.user.name} />
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 relative z-10">
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">
              Welcome back, {memberData.user.name}!
            </h1>
            <p className="text-sm sm:text-base text-gray-600">Your financial overview and account details</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button 
              onClick={handleDownloadInvoice} 
              variant="outline" 
              className="bg-white/80 backdrop-blur-md border-white/30 hover:bg-white shadow-lg w-full sm:w-auto text-sm sm:text-base"
            >
              <Download className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Download Invoice</span>
              <span className="sm:hidden">Invoice</span>
            </Button>
            <Button 
              onClick={() => setShowResetDialog(true)} 
              variant="destructive" 
              className="bg-red-500/80 backdrop-blur-md border-red-300/30 hover:bg-red-600 shadow-lg w-full sm:w-auto text-sm sm:text-base"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Reset Database</span>
              <span className="sm:hidden">Reset</span>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
          <Card className="bg-white/80 backdrop-blur-lg border-white/20 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Total Deposit</CardTitle>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900">TK {memberData.totalDeposit.toFixed(2)}</div>
              <p className="text-xs text-gray-500 mt-1">Total amount deposited</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-lg border-white/20 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Previous Due</CardTitle>
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900">TK {memberData.previousDue.toFixed(2)}</div>
              <p className="text-xs text-gray-500 mt-1">Previous month due</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-lg border-white/20 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Per Extra</CardTitle>
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Receipt className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900">TK {memberData.perExtra.toFixed(2)}</div>
              <p className="text-xs text-gray-500 mt-1">Extra charges per person</p>
            </CardContent>
          </Card>

    
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Card className="bg-white/80 backdrop-blur-lg border-white/20 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-4">
                {memberData.user.picture && (
                  <img
                    src={memberData.user.picture}
                    alt={memberData.user.name}
                    className="h-20 w-20 rounded-full border-4 border-blue-200 shadow-md object-cover"
                  />
                )}
                <div>
                  <CardTitle className="text-gray-900">Member Information</CardTitle>
                  <CardDescription className="text-gray-600">Your profile and account details</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-3 rounded-lg bg-gray-50/50">
                  <p className="text-sm font-medium text-gray-500 mb-1">Name</p>
                  <p className="text-lg font-semibold text-gray-900">{memberData.user.name}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50/50">
                  <p className="text-sm font-medium text-gray-500 mb-1">Department</p>
                  <p className="text-lg font-semibold text-gray-900">{memberData.user.dept}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50/50">
                  <p className="text-sm font-medium text-gray-500 mb-1">Institute</p>
                  <p className="text-lg font-semibold text-gray-900">{memberData.user.institute}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50/50">
                  <p className="text-sm font-medium text-gray-500 mb-1">Email</p>
                  <p className="text-lg font-semibold text-gray-900">{memberData.user.email}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50/50">
                  <p className="text-sm font-medium text-gray-500 mb-1">Phone</p>
                  <p className="text-lg font-semibold text-gray-900">{memberData.user.phone}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50/50">
                  <p className="text-sm font-medium text-gray-500 mb-1">Per Extra</p>
                  <p className="text-lg font-semibold text-gray-900">TK {memberData.perExtra.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-lg border-white/20 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <History className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-gray-900">Deposit History</CardTitle>
                  <CardDescription className="text-gray-600">
                    Your deposits for {format(new Date(currentYear, currentMonth - 1, 1), "MMMM yyyy")}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {depositLogsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : depositLogs && depositLogs.length > 0 ? (
                <div className="space-y-4">
                  <div className="max-h-64 overflow-y-auto">
                    <DepositLogTable depositLogs={depositLogs} showFooter={false} />
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Total This Month:</span>
                      <span className="text-lg font-bold text-blue-600">
                        TK {depositLogs.reduce((sum, log) => sum + log.amount, 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <History className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>No deposits found for this month</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>

      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reset Database</DialogTitle>
            <DialogDescription>
              This action will permanently delete ALL data from the database including:
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>All users and members</li>
                <li>All expenses and transactions</li>
                <li>All deposit logs</li>
                <li>All bazar lists</li>
                <li>All other records</li>
              </ul>
              <strong className="block mt-3 text-red-600">This action cannot be undone!</strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowResetDialog(false)}
              disabled={resetDbMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleResetDb}
              disabled={resetDbMutation.isPending}
            >
              {resetDbMutation.isPending ? "Resetting..." : "Yes, Reset Database"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

