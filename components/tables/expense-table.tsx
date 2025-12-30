"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DailyExpenseWithUser } from "@/types";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Eye } from "lucide-react";

interface ExpenseTableProps {
  expenses: DailyExpenseWithUser[];
  onView?: (expense: DailyExpenseWithUser) => void;
  showActions?: boolean;
  selectedIds?: string[];
  onSelect?: (id: string, checked: boolean) => void;
  onSelectAll?: (checked: boolean) => void;
  showCheckboxes?: boolean;
}

export function ExpenseTable({
  expenses,
  onView,
  showActions = false,
  selectedIds = [],
  onSelect,
  onSelectAll,
  showCheckboxes = false,
}: ExpenseTableProps) {
  const allSelected = expenses.length > 0 && expenses.every(e => selectedIds.includes(e.id));
  const someSelected = expenses.some(e => selectedIds.includes(e.id));

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {showCheckboxes && (
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = someSelected && !allSelected;
                  }}
                  onChange={(e) => onSelectAll?.(e.target.checked)}
                  className="cursor-pointer"
                />
              </TableHead>
            )}
            <TableHead>Date</TableHead>
            <TableHead>Added By</TableHead>
            <TableHead>Bazar/Shop</TableHead>
            <TableHead>Total TK</TableHead>
            <TableHead>Extra</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Notes</TableHead>
            {showActions && <TableHead>Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.length === 0 ? (
            <TableRow>
              <TableCell colSpan={showCheckboxes ? (showActions ? 9 : 8) : (showActions ? 8 : 7)} className="text-center">
                No expenses found
              </TableCell>
            </TableRow>
          ) : (
            expenses.map((expense) => (
              <TableRow key={expense.id}>
                {showCheckboxes && (
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(expense.id)}
                      onChange={(e) => onSelect?.(expense.id, e.target.checked)}
                      className="cursor-pointer"
                    />
                  </TableCell>
                )}
                <TableCell>
                  {format(new Date(expense.date), "dd/MM/yyyy")}
                </TableCell>
                <TableCell>
                  {expense.addedByUser ? expense.addedByUser.name : "N/A"}
                </TableCell>
                <TableCell>{expense.bazarShop}</TableCell>
                <TableCell>TK {expense.totalTK.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant="secondary">TK {expense.extra.toFixed(2)}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={expense.approved ? "default" : "destructive"}>
                    {expense.approved ? "Approved" : "Pending"}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-xs truncate">
                  {expense.notes || "-"}
                </TableCell>
                {showActions && (
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {expense.bazarListUpload && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(expense.bazarListUpload, "_blank")}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      {onView && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onView(expense)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

