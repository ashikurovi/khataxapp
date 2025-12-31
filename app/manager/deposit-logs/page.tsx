"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/layout/navbar";
import { DepositLogTable } from "@/components/tables/deposit-log-table";
import { apiClient } from "@/lib/api-client";
import { DepositLogWithUser } from "@/types";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function DepositLogsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const today = new Date();
  const todayMonth = today.getMonth() + 1;
  const todayYear = today.getFullYear();

  const { data: allDepositLogs, isLoading } = useQuery({
    queryKey: ["deposit-logs", todayMonth, todayYear],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("month", todayMonth.toString());
      params.append("year", todayYear.toString());
      
      const response = await apiClient.get<DepositLogWithUser[]>(
        `/heshab/deposit-logs?${params.toString()}`
      );
      return response.data || [];
    },
  });

  // Filter to show only today's logs and apply search
  const depositLogs = useMemo(() => {
    if (!allDepositLogs) return [];
    const todayStr = format(today, "yyyy-MM-dd");
    let filtered = allDepositLogs.filter((log) => {
      const logDateStr = format(new Date(log.date), "yyyy-MM-dd");
      return logDateStr === todayStr;
    });
    
    // Apply search filter if search term exists
    if (searchTerm.trim()) {
      filtered = filtered.filter((log) =>
        log.user.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }, [allDepositLogs, today, searchTerm]);

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
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">Deposit Logs</h1>
          <p className="text-sm sm:text-base text-gray-600">View daily deposit records</p>
        </div>

        <Card className="bg-white/80 backdrop-blur-lg border-white/20 shadow-lg">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-gray-900">Today's Deposit Logs</CardTitle>
                <CardDescription className="text-gray-600">
                  Deposit records for {format(today, "dd MMMM yyyy")}
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-auto sm:min-w-[250px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by member name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/80 backdrop-blur-md border-white/30"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-gray-600">Loading...</p>
            ) : (
              <DepositLogTable depositLogs={depositLogs || []} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
