import { CronJob } from "cron";

import { backup } from "./backup";
import { env } from "./env";

const job = new CronJob(env.BACKUP_CRON_SCHEDULE, async () => {
  try {
    await backup();
    console.log("=======================")
    console.log('Next run:', job.nextDate().toFormat("dd-MMM-yyyy hh:mm"));
  } catch (error) {
    console.error("Error while running backup: ", error)
  }
});

job.start();
job.addCallback(()=>{
  console.log('Next run:', job.nextDate().toFormat("dd-MMM-YY hh:mm"));
});


console.log("Backup cron scheduler started.");
console.log("Current dateTime: "+new Date())
console.log("BACKUP_CRON_SCHEDULE: "+env.BACKUP_CRON_SCHEDULE)
