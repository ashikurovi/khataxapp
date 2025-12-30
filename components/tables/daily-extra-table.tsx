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
import { DailyExtraWithUser } from "@/types";
import { format } from "date-fns";

interface DailyExtraTableProps {
  dailyExtras: DailyExtraWithUser[];
  showFooter?: boolean;
}

export function DailyExtraTable({ dailyExtras, showFooter = true }: DailyExtraTableProps) {
  const totalAmount = dailyExtras.reduce((sum, extra) => sum + extra.amount, 0);

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Added By</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {dailyExtras.map((extra) => (
            <TableRow key={extra.id}>
              <TableCell>{format(new Date(extra.date), "MMM dd, yyyy")}</TableCell>
              <TableCell>{extra.reason}</TableCell>
              <TableCell>TK {extra.amount.toFixed(2)}</TableCell>
              <TableCell>{extra.addedByUser.name}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        {showFooter && (
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

