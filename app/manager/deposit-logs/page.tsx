"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/layout/navbar";
import { DepositLogTable } from "@/components/tables/deposit-log-table";
import { apiClient } from "@/lib/api-client";
import { DepositLogWithUser, MemberWithUser } from "@/types";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export default function DepositLogsPage() {
  const [month, setMonth] = useState<number | null>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number | null>(new Date().getFullYear());
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const { data: members } = useQuery({
    queryKey: ["members"],
    queryFn: async () => {
      const response = await apiClient.get<MemberWithUser[]>("/members");
      return response.data || [];
    },
  });

  const { data: depositLogs, isLoading } = useQuery({
    queryKey: ["deposit-logs", month, year, selectedUserId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (month) params.append("month", month.toString());
      if (year) params.append("year", year.toString());
      if (selectedUserId) params.append("userId", selectedUserId);
      
      const response = await apiClient.get<DepositLogWithUser[]>(
        `/heshab/deposit-logs?${params.toString()}`
      );
      return response.data || [];
    },
    enabled: !!(month && year),
  });

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
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">Deposit Logs</h1>
            <p className="text-sm sm:text-base text-gray-600">View daily deposit records</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="flex gap-2">
              <Input
                type="number"
                min="1"
                max="12"
                value={month || ""}
                onChange={(e) => setMonth(e.target.value ? Number(e.target.value) : null)}
                className="w-20 bg-white/80 backdrop-blur-md border-white/30"
                placeholder="Month"
              />
              <Input
                type="number"
                min="2020"
                max="2100"
                value={year || ""}
                onChange={(e) => setYear(e.target.value ? Number(e.target.value) : null)}
                className="w-24 bg-white/80 backdrop-blur-md border-white/30"
                placeholder="Year"
              />
            </div>
            <select
              value={selectedUserId || ""}
              onChange={(e) => setSelectedUserId(e.target.value || null)}
              className="flex h-10 rounded-md border border-input bg-white/80 backdrop-blur-md px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">All Members</option>
              {members?.map((member) => (
                <option key={member.id} value={member.userId}>
                  {member.user.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Card className="bg-white/80 backdrop-blur-lg border-white/20 shadow-lg">
          <CardHeader>
            <CardTitle className="text-gray-900">Deposit Log</CardTitle>
            <CardDescription className="text-gray-600">
              {month && year
                ? `Daily deposit records for ${month}/${year}${selectedUserId ? ` - ${members?.find((m) => m.userId === selectedUserId)?.user.name || ""}` : ""}`
                : "Select month and year to view deposit logs"}
            </CardDescription>
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

