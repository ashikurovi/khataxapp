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
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface DailyExtraTableProps {
  dailyExtras: DailyExtraWithUser[];
  showFooter?: boolean;
  onDelete?: (id: string) => void;
  showActions?: boolean;
}

export function DailyExtraTable({ 
  dailyExtras, 
  showFooter = true, 
  onDelete,
  showActions = false 
}: DailyExtraTableProps) {
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
            {showActions && <TableHead>Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {dailyExtras.length === 0 ? (
            <TableRow>
              <TableCell colSpan={showActions ? 5 : 4} className="text-center">
                No daily extras found
              </TableCell>
            </TableRow>
          ) : (
            dailyExtras.map((extra) => (
              <TableRow key={extra.id}>
                <TableCell>{format(new Date(extra.date), "MMM dd, yyyy")}</TableCell>
                <TableCell>{extra.reason}</TableCell>
                <TableCell>TK {extra.amount.toFixed(2)}</TableCell>
                <TableCell>{extra.addedByUser.name}</TableCell>
                {showActions && (
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete?.(extra.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
        {showFooter && dailyExtras.length > 0 && (
          <TableFooter>
            <TableRow>
              <TableCell colSpan={2} className="text-right font-bold">
                Total:
              </TableCell>
              <TableCell className="font-bold">TK {totalAmount.toFixed(2)}</TableCell>
              <TableCell></TableCell>
              {showActions && <TableCell></TableCell>}
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </div>
  );
}

