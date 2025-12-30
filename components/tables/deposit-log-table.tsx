"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { DepositLogWithUser } from "@/types";
import { format } from "date-fns";

interface DepositLogTableProps {
  depositLogs: DepositLogWithUser[];
  showFooter?: boolean;
}

export function DepositLogTable({ depositLogs, showFooter = true }: DepositLogTableProps) {
  const totalAmount = depositLogs.reduce((sum, log) => sum + log.amount, 0);

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Member</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Description</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {depositLogs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                No deposit logs found
              </TableCell>
            </TableRow>
          ) : (
            depositLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{format(new Date(log.date), "dd/MM/yyyy")}</TableCell>
                <TableCell className="font-medium">{log.user.name}</TableCell>
                <TableCell>TK {log.amount.toFixed(2)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {log.description || "-"}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
        {showFooter && depositLogs.length > 0 && (
          <TableFooter>
            <TableRow>
              <TableCell colSpan={2} className="text-right font-bold">
                Total:
              </TableCell>
              <TableCell className="font-bold">TK {totalAmount.toFixed(2)}</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </div>
  );
}

