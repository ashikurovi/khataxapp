"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import { apiClient } from "@/lib/api-client";
import { MemberWithUser, DailyExpenseWithUser, DepositLogWithUser } from "@/types";
import { Users, DollarSign, FileText, TrendingUp, Wallet, CheckCircle2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ManagerDashboardPage() {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11, so add 1
  const currentYear = currentDate.getFullYear();
  const queryClient = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ["manager-stats"],
    queryFn: async () => {
      const [membersRes, expensesRes, depositLogsRes] = await Promise.all([
        apiClient.get<MemberWithUser[]>("/members"),
        apiClient.get<DailyExpenseWithUser[]>("/expenses"),
        apiClient.get<DepositLogWithUser[]>(
          `/heshab/deposit-logs?month=${currentMonth}&year=${currentYear}`
        ),
      ]);

      const members = membersRes.data || [];
      const expenses = expensesRes.data || [];
      const depositLogs = depositLogsRes.data || [];

      const totalManagerReceivable = members.reduce(
        (sum, m) => sum + m.managerReceivable,
        0
      );
      const totalBorder = members.reduce((sum, m) => sum + m.border, 0);
      // Total expense should come from members' totalExpense (includes approved expenses + daily extras)
      // This ensures daily extras are included in the total
      const totalExpenses = members.reduce(
        (sum, m) => sum + m.totalExpense,
        0
      );
      // Only count approved expenses for the graph (daily extras are not shown in expense graph)
      const approvedExpenses = expenses.filter(e => e.approved);
      const pendingExpenses = expenses.filter(e => !e.approved);
      const totalDeposits = depositLogs.reduce(
        (sum, log) => sum + log.amount,
        0
      );

      // Process expenses for daily cost graph (current month only, only approved)
      const currentMonthExpenses = approvedExpenses.filter((expense) => {
        const expenseDate = new Date(expense.date);
        return (
          expenseDate.getMonth() + 1 === currentMonth &&
          expenseDate.getFullYear() === currentYear
        );
      });

      // Group expenses by day
      const dailyCostsMap = new Map<number, number>();
      currentMonthExpenses.forEach((expense) => {
        const expenseDate = new Date(expense.date);
        const day = expenseDate.getDate();
        const totalCost = expense.totalTK + expense.extra;
        dailyCostsMap.set(day, (dailyCostsMap.get(day) || 0) + totalCost);
      });

      // Create array for all days in current month
      const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
      const dailyCostsData = Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        return {
          day: day.toString(),
          cost: dailyCostsMap.get(day) || 0,
        };
      });

      return {
        totalMembers: members.length,
        totalManagerReceivable,
        totalBorder,
        totalExpenses,
        totalDeposits,
        dailyCostsData,
        pendingExpenses,
      };
    },
  });

  const approveExpenseMutation = useMutation({
    mutationFn: async (expenseId: string) => {
      const response = await apiClient.patch(`/expenses/${expenseId}/approve`);
      if (!response.success) {
        throw new Error(response.error || "Failed to approve expense");
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manager-stats"] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
    onError: (error: Error) => {
      alert(`Error: ${error.message}`);
    },
  });

  const handleApproveExpense = (expenseId: string) => {
    if (confirm("Are you sure you want to approve this expense? It will be added to total expenses.")) {
      approveExpenseMutation.mutate(expenseId);
    }
  };

  const deleteAllMutation = useMutation({
    mutationFn: async (table: string) => {
      const response = await apiClient.post<{ totalDeleted?: number; deletedCount?: number; table?: string; collections?: Record<string, number> }>("/delete-all", { table });
      if (!response.success) {
        throw new Error(response.error || "Failed to delete data");
      }
      return response;
    },
    onSuccess: (data, table) => {
      queryClient.invalidateQueries();
      const deletedCount = table === "all" 
        ? data.data?.totalDeleted || 0 
        : data.data?.deletedCount || 0;
      alert(`Successfully deleted ${deletedCount} record(s) from ${table === "all" ? "all tables" : table}`);
    },
    onError: (error: Error) => {
      alert(`Error: ${error.message}`);
    },
  });

  const handleDeleteAll = (table: string) => {
    const tableName = table === "all" ? "ALL TABLES" : table;
    if (confirm(`Are you sure you want to delete ALL data from ${tableName}? This action cannot be undone!`)) {
      deleteAllMutation.mutate(table);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <Navbar userRole="Manager" />
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 relative z-10">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">Manager Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600">
            Overview of mess management system
          </p>
        </div>

        {/* Daily Cost Graph */}
        <Card className="bg-white/80 backdrop-blur-lg border-white/20 shadow-lg mb-6 sm:mb-8">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl text-gray-900">
              Daily Cost - {new Date(currentYear, currentMonth - 1).toLocaleString("default", { month: "long", year: "numeric" })}
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-gray-600">
              Expense per day for the current month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats?.dailyCostsData || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="day" 
                    stroke="#6b7280"
                    fontSize={12}
                    tick={{ fill: "#6b7280" }}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    fontSize={12}
                    tick={{ fill: "#6b7280" }}
                    tickFormatter={(value) => `TK ${value}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px"
                    }}
                    formatter={(value: number | undefined) => [`TK ${value !== undefined ? value.toFixed(2) : '0.00'}`, "Cost"]}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="cost" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: "#3b82f6", r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Daily Cost"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards for Totals */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 mb-6 sm:mb-8">
          <Card className="bg-white/80 backdrop-blur-lg border-white/20 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-700">Total Members</CardTitle>
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                {stats?.totalMembers || 0}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-lg border-white/20 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-700">Total Deposit</CardTitle>
              <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-emerald-600 break-words">
                TK {stats?.totalDeposits.toFixed(2) || "0.00"}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-lg border-white/20 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-700">Total Expense</CardTitle>
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-red-600 break-words">
                TK {stats?.totalExpenses.toFixed(2) || "0.00"}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-lg border-white/20 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-700">Total Border</CardTitle>
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-indigo-600 break-words">
                TK {stats?.totalBorder.toFixed(2) || "0.00"}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-lg border-white/20 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-700">Total Receivable</CardTitle>
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-purple-600 break-words">
                TK {stats?.totalManagerReceivable.toFixed(2) || "0.00"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Expenses Section */}
        {stats?.pendingExpenses && stats.pendingExpenses.length > 0 && (
          <Card className="bg-white/80 backdrop-blur-lg border-white/20 shadow-lg mb-6 sm:mb-8">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl text-gray-900">
                Pending Expenses Approval
              </CardTitle>
              <CardDescription className="text-sm sm:text-base text-gray-600">
                Review and approve daily expenses to add them to total expense
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.pendingExpenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4 bg-white/60 backdrop-blur-md border border-white/30 rounded-lg hover:bg-white/80 transition-all"
                  >
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Date</p>
                        <p className="text-sm font-medium text-gray-900">
                          {format(new Date(expense.date), "MMM dd, yyyy")}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Bazar/Shop</p>
                        <p className="text-sm font-medium text-gray-900">{expense.bazarShop}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Amount</p>
                        <p className="text-sm font-medium text-gray-900">
                          TK {(expense.totalTK + expense.extra).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Added By</p>
                        <p className="text-sm font-medium text-gray-900">
                          {expense.addedByUser ? expense.addedByUser.name : "N/A"}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleApproveExpense(expense.id)}
                      disabled={approveExpenseMutation.isPending}
                      className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      {approveExpenseMutation.isPending ? "Approving..." : "Approve"}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
          <Card className="bg-white/80 backdrop-blur-lg border-white/20 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl text-gray-900">Delete All Data</CardTitle>
              <CardDescription className="text-sm sm:text-base text-gray-600">Delete all records from specific tables</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 sm:gap-3">
              <Button
                variant="destructive"
                onClick={() => handleDeleteAll("all")}
                disabled={deleteAllMutation.isPending}
                className="bg-red-600 hover:bg-red-700 text-white w-full"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {deleteAllMutation.isPending ? "Deleting..." : "Delete All Tables"}
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleDeleteAll("members")}
                  disabled={deleteAllMutation.isPending}
                  className="text-xs sm:text-sm"
                >
                  Delete Members
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDeleteAll("users")}
                  disabled={deleteAllMutation.isPending}
                  className="text-xs sm:text-sm"
                >
                  Delete Users
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDeleteAll("dailyExpenses")}
                  disabled={deleteAllMutation.isPending}
                  className="text-xs sm:text-sm"
                >
                  Delete Expenses
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDeleteAll("dailyExtras")}
                  disabled={deleteAllMutation.isPending}
                  className="text-xs sm:text-sm"
                >
                  Delete Daily Extras
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDeleteAll("bazarLists")}
                  disabled={deleteAllMutation.isPending}
                  className="text-xs sm:text-sm"
                >
                  Delete Bazar Lists
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDeleteAll("depositLogs")}
                  disabled={deleteAllMutation.isPending}
                  className="text-xs sm:text-sm"
                >
                  Delete Deposit Logs
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDeleteAll("heshabs")}
                  disabled={deleteAllMutation.isPending}
                  className="text-xs sm:text-sm"
                >
                  Delete Heshab
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDeleteAll("transactions")}
                  disabled={deleteAllMutation.isPending}
                  className="text-xs sm:text-sm"
                >
                  Delete Transactions
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-lg border-white/20 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl text-gray-900">Quick Actions</CardTitle>
              <CardDescription className="text-sm sm:text-base text-gray-600">Common management tasks</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 sm:gap-3">
              <a href="/manager/heshab">
                <Card className="p-3 sm:p-4 bg-white/60 backdrop-blur-md border-white/30 hover:bg-white/80 hover:shadow-md transition-all cursor-pointer">
                  <CardTitle className="text-base sm:text-lg text-gray-900">Heshab</CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-gray-600">Manage deposits and send invoices</CardDescription>
                </Card>
              </a>
              <a href="/manager/members">
                <Card className="p-3 sm:p-4 bg-white/60 backdrop-blur-md border-white/30 hover:bg-white/80 hover:shadow-md transition-all cursor-pointer">
                  <CardTitle className="text-base sm:text-lg text-gray-900">Members</CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-gray-600">Add, edit, and view members</CardDescription>
                </Card>
              </a>
              <a href="/manager/daily-extra">
                <Card className="p-3 sm:p-4 bg-white/60 backdrop-blur-md border-white/30 hover:bg-white/80 hover:shadow-md transition-all cursor-pointer">
                  <CardTitle className="text-base sm:text-lg text-gray-900">Daily Extra</CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-gray-600">Track daily extra expenses</CardDescription>
                </Card>
              </a>
              <a href="/manager/expenses">
                <Card className="p-3 sm:p-4 bg-white/60 backdrop-blur-md border-white/30 hover:bg-white/80 hover:shadow-md transition-all cursor-pointer">
                  <CardTitle className="text-base sm:text-lg text-gray-900">Daily Expenses</CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-gray-600">Track and manage daily expenses</CardDescription>
                </Card>
              </a>
              <a href="/manager/bazar">
                <Card className="p-3 sm:p-4 bg-white/60 backdrop-blur-md border-white/30 hover:bg-white/80 hover:shadow-md transition-all cursor-pointer">
                  <CardTitle className="text-base sm:text-lg text-gray-900">Bazar Schedule</CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-gray-600">Generate and manage bazar list</CardDescription>
                </Card>
              </a>
              <a href="/manager/deposit-logs">
                <Card className="p-3 sm:p-4 bg-white/60 backdrop-blur-md border-white/30 hover:bg-white/80 hover:shadow-md transition-all cursor-pointer">
                  <CardTitle className="text-base sm:text-lg text-gray-900">Deposit Logs</CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-gray-600">View daily deposit records</CardDescription>
                </Card>
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

