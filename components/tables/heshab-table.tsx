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
import { HeshabWithUser } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";

interface HeshabTableProps {
  heshabRecords: HeshabWithUser[];
  showFooter?: boolean;
  onUpdateExpense?: (heshabId: string, currentExpense: number) => void;
}

export function HeshabTable({ heshabRecords, showFooter = true, onUpdateExpense }: HeshabTableProps) {
  const totalDeposit = heshabRecords.reduce((sum, h) => sum + h.deposit, 0);
  const totalPerExtra = heshabRecords.reduce((sum, h) => sum + h.perExtra, 0);
  const totalExpense = heshabRecords.reduce((sum, h) => sum + h.totalExpense, 0);
  const totalBorder = heshabRecords.reduce((sum, h) => sum + (h.currentBalance > 0 ? h.currentBalance : 0), 0);
  const totalManagerReceivable = heshabRecords.reduce((sum, h) => sum + h.due, 0);

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Deposit</TableHead>
            <TableHead>Per Extra</TableHead>
            <TableHead>Total Expense</TableHead>
            <TableHead>Border</TableHead>
            <TableHead>Manager Receivable</TableHead>
            {onUpdateExpense && <TableHead>Action</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {heshabRecords.map((heshab) => (
            <TableRow key={heshab.id}>
              <TableCell className="font-medium">{heshab.user.name}</TableCell>
              <TableCell>TK {heshab.deposit.toFixed(2)}</TableCell>
              <TableCell>TK {heshab.perExtra.toFixed(2)}</TableCell>
              <TableCell>TK {heshab.totalExpense.toFixed(2)}</TableCell>
              <TableCell>
                {heshab.currentBalance > 0 ? (
                  <Badge variant="secondary">
                    TK {heshab.currentBalance.toFixed(2)}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                {heshab.due > 0 ? (
                  <Badge variant="destructive">
                    TK {heshab.due.toFixed(2)}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              {onUpdateExpense && (
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateExpense(heshab.id, heshab.totalExpense)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Update Expense
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
        {showFooter && (
          <TableFooter>
            <TableRow>
              <TableCell colSpan={3} className="text-right font-bold">
                Totals:
              </TableCell>
              <TableCell className="font-bold">TK {totalExpense.toFixed(2)}</TableCell>
              <TableCell className="font-bold">TK {totalBorder.toFixed(2)}</TableCell>
              <TableCell className="font-bold">TK {totalManagerReceivable.toFixed(2)}</TableCell>
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </div>
  );
}

