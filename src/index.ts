import { CronJob } from "cron";
import * as Sentry from "@sentry/node";
import { backup } from "./backup";
import { env } from "./env";

  Sentry.init({
    dsn: env.SENTRY_DNS,
    tracesSampleRate: 1.0,
    environment:env.SENTRY_ENV
  });

const job = new CronJob(env.BACKUP_CRON_SCHEDULE, async () => {

  const checkInId = Sentry.captureCheckIn({ monitorSlug: env.SENTRY_MONITORING_SLUG, status: "in_progress" });

  try {
    await backup();
    Sentry.captureCheckIn({ checkInId, monitorSlug: env.SENTRY_MONITORING_SLUG, status: "ok" });
    console.log("=======================")
    console.log('Next run:', job.nextDate().toFormat("dd-MMM-yyyy hh:mm"));
  } catch (error) {
    console.error("Error while running backup: ", error)
    Sentry.captureException(error);
    Sentry.captureCheckIn({ checkInId, monitorSlug: env.SENTRY_MONITORING_SLUG, status: "error" });
  }
});

job.start();

console.log("Backup cron scheduler started.");
console.log("Current dateTime: "+new Date())
console.log("BACKUP_CRON_SCHEDULE: "+env.BACKUP_CRON_SCHEDULE)
