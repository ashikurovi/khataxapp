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
import { Label } from "@/components/ui/label";
import { Search, Calendar } from "lucide-react";

export default function DepositLogsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const today = new Date();
  const [startDate, setStartDate] = useState(format(today, "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(today, "yyyy-MM-dd"));

  const { data: depositLogs, isLoading } = useQuery({
    queryKey: ["deposit-logs", startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      
      const response = await apiClient.get<DepositLogWithUser[]>(
        `/heshab/deposit-logs?${params.toString()}`
      );
      return response.data || [];
    },
  });

  // Apply search filter
  const filteredDepositLogs = useMemo(() => {
    if (!depositLogs) return [];
    
    if (searchTerm.trim()) {
      return depositLogs.filter((log) =>
        log.user.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return depositLogs;
  }, [depositLogs, searchTerm]);

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
            <div className="flex flex-col gap-4">
              <div>
                <CardTitle className="text-gray-900">Deposit Logs</CardTitle>
                <CardDescription className="text-gray-600">
                  View deposit records by date range
                </CardDescription>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  <div className="flex-1">
                    <Label htmlFor="startDate" className="text-sm text-gray-700 mb-2 block">
                      <Calendar className="inline h-4 w-4 mr-1" />
                      Start Date
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-white/80 backdrop-blur-md border-white/30"
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="endDate" className="text-sm text-gray-700 mb-2 block">
                      <Calendar className="inline h-4 w-4 mr-1" />
                      End Date
                    </Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="bg-white/80 backdrop-blur-md border-white/30"
                    />
                  </div>
                </div>
                <div className="relative w-full sm:w-auto sm:min-w-[250px]">
                  <Label htmlFor="search" className="text-sm text-gray-700 mb-2 block">
                    <Search className="inline h-4 w-4 mr-1" />
                    Search
                  </Label>
                  <Input
                    id="search"
                    type="text"
                    placeholder="Search by member name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white/80 backdrop-blur-md border-white/30"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-gray-600">Loading...</p>
            ) : (
              <DepositLogTable depositLogs={filteredDepositLogs || []} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
