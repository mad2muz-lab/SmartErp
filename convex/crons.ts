import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Check for expired countdowns every hour and disable users
crons.interval(
  "check-expired-countdowns",
  { hours: 1 },
  internal.countdownManagement.checkExpiredCountdowns,
  {}
);

// Temporarily disabled - securityAudit file was moved
// crons.interval(
//   "cleanup-expired-sessions",
//   { minutes: 30 },
//   internal.securityAudit.cleanupExpiredSessions,
//   {}
// );

export default crons;
