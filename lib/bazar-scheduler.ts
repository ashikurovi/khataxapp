import { addDays, isAfter, isBefore } from "date-fns";
import { BazarList, BazarStatus, SemesterBreak, User } from "@/types";

export class BazarScheduler {
  /**
   * Generate daily bazar schedule
   * Assigns 2 different people per day
   * Same person cannot do bazar on consecutive days
   * Rotates through all eligible members
   * Skips certain members by name
   */
  static generateSchedule(
    startDate: Date,
    endDate: Date,
    members: User[],
    semesterBreaks: SemesterBreak[] = []
  ): Omit<BazarList, "id" | "createdAt" | "updatedAt">[] {
    // Names to skip (case insensitive)
    const skipNames = ['ovi', 'nasir', 'moraslin', 'shorif', 'xhiba', 'niyaz', 'aif', 'arman', 'rony', 'morsalin boss', 'robi', 'xihab', 'akash', 'asif'];
    
    // Filter out members with names to skip
    const eligibleMembers = members.filter(member => 
      !skipNames.some(skipName => member.name.toLowerCase().includes(skipName.toLowerCase()))
    );

    if (eligibleMembers.length === 0) {
      return [];
    }

    const schedule: Omit<BazarList, "id" | "createdAt" | "updatedAt">[] = [];
    let currentDate = new Date(startDate);
    let bazarNo = 1;
    let memberIndex = 0;
    
    // Track who was assigned yesterday (to avoid consecutive days)
    let yesterdayAssigned: string[] = [];

    while (isBefore(currentDate, endDate) || currentDate.getTime() === endDate.getTime()) {
      // Check if current date is within a semester break
      const isInBreak = semesterBreaks.some(
        (breakPeriod) =>
          isAfter(currentDate, breakPeriod.startDate) &&
          isBefore(currentDate, breakPeriod.endDate)
      );

      if (!isInBreak) {
        // Find 2 eligible members for today
        // Eligible = not assigned yesterday (to avoid consecutive days)
        const availableMembers = eligibleMembers.filter(member => 
          !yesterdayAssigned.includes(member.id)
        );

        // If we have at least 2 available members, assign 2
        if (availableMembers.length >= 2) {
          // Select 2 members for this bazar (rotate through available members)
          const firstIndex = memberIndex % availableMembers.length;
          const secondIndex = (memberIndex + 1) % availableMembers.length;
          
          const firstMember = availableMembers[firstIndex];
          const secondMember = availableMembers[secondIndex];
          
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
          
          // Track who was assigned today (for tomorrow's check)
          yesterdayAssigned = [firstMember.id, secondMember.id];
          bazarNo++;
          memberIndex += 2;
        } else if (availableMembers.length === 1) {
          // If only 1 available, assign that person
          const selectedMember = availableMembers[0];
          schedule.push({
            bazarNo,
            date: new Date(currentDate),
            assignedTo: selectedMember.id,
            status: BazarStatus.PENDING,
          });
          
          // Track who was assigned today
          yesterdayAssigned = [selectedMember.id];
          bazarNo++;
          memberIndex++;
        } else {
          // If no available members (all were assigned yesterday), use all members
          // This allows rotation even if all were assigned yesterday
          const firstIndex = memberIndex % eligibleMembers.length;
          const secondIndex = (memberIndex + 1) % eligibleMembers.length;
          
          const firstMember = eligibleMembers[firstIndex];
          const secondMember = eligibleMembers[secondIndex];
          
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
          
          yesterdayAssigned = [firstMember.id, secondMember.id];
          bazarNo++;
          memberIndex += 2;
        }
      } else {
        // If in break, reset yesterday assigned (so after break, anyone can be assigned)
        yesterdayAssigned = [];
      }

      // Move to next day (daily bazar)
      currentDate = addDays(currentDate, 1);
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

