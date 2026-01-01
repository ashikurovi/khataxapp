import HeshabModel from "@/app/api/models/Heshab";
import DailyExtraModel from "@/app/api/models/DailyExtra";
import MemberModel from "@/app/api/models/Member";

/**
 * Recalculates perExtra for all heshab records based on current member count
 * This should be called whenever:
 * - A member is added
 * - A member is removed
 * - Daily extras are modified
 */
export async function recalculatePerExtraForAllHeshab() {
  try {
    // Get all unique month/year combinations from heshab records
    const heshabRecords = await HeshabModel.find().select("month year").lean();
    const uniqueMonths = new Set(
      heshabRecords.map((h: any) => `${h.year}-${h.month}`)
    );

    // Get current member count
    const memberCount = await MemberModel.countDocuments();

    // Recalculate perExtra for each unique month/year
    const updatePromises = Array.from(uniqueMonths).map(async (monthKey) => {
      const [year, month] = monthKey.split("-").map(Number);

      // Get all daily extras for this month
      const dailyExtras = await DailyExtraModel.find({
        date: {
          $gte: new Date(year, month - 1, 1),
          $lt: new Date(year, month, 1),
        },
      }).lean();

      const totalExtra = dailyExtras.reduce(
        (sum, extra) => sum + extra.amount,
        0
      );
      const perExtra = memberCount > 0 ? totalExtra / memberCount : 0;

      // Update all heshab records for this month
      const heshabRecordsForMonth = await HeshabModel.find({
        month,
        year,
      }).lean();

      const heshabUpdatePromises = heshabRecordsForMonth.map(
        async (heshab: any) => {
          // Recalculate balance: (deposit + perExtra) - totalExpense
          const calculatedBalance =
            heshab.deposit + perExtra - heshab.totalExpense;

          // Calculate border and due
          let border = 0;
          let due = 0;
          let currentBalance = calculatedBalance;

          if (calculatedBalance > 0) {
            border = calculatedBalance;
          } else if (calculatedBalance < 0) {
            due = Math.abs(calculatedBalance);
          }

          await HeshabModel.findByIdAndUpdate(heshab._id, {
            perExtra,
            currentBalance,
            due,
          });
        }
      );

      await Promise.all(heshabUpdatePromises);
    });

    await Promise.all(updatePromises);

    // Also update Member model perExtra for all members
    // Get all unique months from daily extras to calculate perExtra per month
    const allDailyExtras = await DailyExtraModel.find().lean();
    const monthlyExtras = new Map<string, number>();

    allDailyExtras.forEach((extra: any) => {
      const date = new Date(extra.date);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const key = `${year}-${month}`;
      monthlyExtras.set(
        key,
        (monthlyExtras.get(key) || 0) + extra.amount
      );
    });

    // Calculate average perExtra across all months (or use latest month)
    const totalExtra = Array.from(monthlyExtras.values()).reduce(
      (sum, amount) => sum + amount,
      0
    );
    const averagePerExtra = memberCount > 0 ? totalExtra / memberCount : 0;

    // Update all members with the average perExtra
    await MemberModel.updateMany(
      {},
      {
        $set: {
          perExtra: averagePerExtra,
        },
      }
    );

    return { success: true };
  } catch (error: any) {
    console.error("Error recalculating perExtra:", error);
    throw error;
  }
}

/**
 * Recalculates perExtra for a specific month/year
 */
export async function recalculatePerExtraForMonth(
  month: number,
  year: number
) {
  try {
    // Get current member count
    const memberCount = await MemberModel.countDocuments();

    // Get all daily extras for this month
    const dailyExtras = await DailyExtraModel.find({
      date: {
        $gte: new Date(year, month - 1, 1),
        $lt: new Date(year, month, 1),
      },
    }).lean();

    const totalExtra = dailyExtras.reduce(
      (sum, extra) => sum + extra.amount,
      0
    );
    const perExtra = memberCount > 0 ? totalExtra / memberCount : 0;

    // Update all heshab records for this month
    const heshabRecords = await HeshabModel.find({ month, year }).lean();

    const heshabUpdatePromises = heshabRecords.map(async (heshab: any) => {
      // Recalculate balance: (deposit + perExtra) - totalExpense
      const calculatedBalance =
        heshab.deposit + perExtra - heshab.totalExpense;

      // Calculate border and due
      let border = 0;
      let due = 0;
      let currentBalance = calculatedBalance;

      if (calculatedBalance > 0) {
        border = calculatedBalance;
      } else if (calculatedBalance < 0) {
        due = Math.abs(calculatedBalance);
      }

      await HeshabModel.findByIdAndUpdate(heshab._id, {
        perExtra,
        currentBalance,
        due,
      });
    });

    await Promise.all(heshabUpdatePromises);

    return { success: true, perExtra };
  } catch (error: any) {
    console.error("Error recalculating perExtra for month:", error);
    throw error;
  }
}
