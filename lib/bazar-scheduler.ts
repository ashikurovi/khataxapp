import { addDays, isAfter, isBefore } from "date-fns";
import { BazarList, BazarStatus, SemesterBreak, User } from "@/types";

export class BazarScheduler {
  /**
   * Generate bazar schedule with 4-day gap, skipping semester breaks
   * Assigns 2 different people per date
   */
  static generateSchedule(
    startDate: Date,
    endDate: Date,
    members: User[],
    semesterBreaks: SemesterBreak[] = []
  ): Omit<BazarList, "id" | "createdAt" | "updatedAt">[] {
    const schedule: Omit<BazarList, "id" | "createdAt" | "updatedAt">[] = [];
    let currentDate = new Date(startDate);
    let bazarNo = 1;
    let memberIndex = 0;

    while (isBefore(currentDate, endDate) || currentDate.getTime() === endDate.getTime()) {
      // Check if current date is within a semester break
      const isInBreak = semesterBreaks.some(
        (breakPeriod) =>
          isAfter(currentDate, breakPeriod.startDate) &&
          isBefore(currentDate, breakPeriod.endDate)
      );

      if (!isInBreak) {
        // Assign 2 different people to the same date
        if (members.length >= 2) {
          const firstMemberIndex = memberIndex % members.length;
          const secondMemberIndex = (memberIndex + 1) % members.length;
          
          const firstMember = members[firstMemberIndex];
          const secondMember = members[secondMemberIndex];
          
          schedule.push({
            bazarNo,
            date: new Date(currentDate),
            assignedTo: firstMember.id,
            status: BazarStatus.PENDING,
          });
          
          schedule.push({
            bazarNo,
            date: new Date(currentDate),
            assignedTo: secondMember.id,
            status: BazarStatus.PENDING,
          });
          
          bazarNo++;
          memberIndex += 2;
        } else if (members.length === 1) {
          // If only one member, assign only that person
          const assignedMember = members[0];
          schedule.push({
            bazarNo,
            date: new Date(currentDate),
            assignedTo: assignedMember.id,
            status: BazarStatus.PENDING,
          });
          bazarNo++;
          memberIndex++;
        }
      }

      // Move to next date (4 days later)
      currentDate = addDays(currentDate, 4);
    }

    return schedule;
  }

  /**
   * Check if a date falls within any semester break
   */
  static isInSemesterBreak(date: Date, breaks: SemesterBreak[]): boolean {
    return breaks.some(
      (breakPeriod) =>
        isAfter(date, breakPeriod.startDate) && isBefore(date, breakPeriod.endDate)
    );
  }
}

