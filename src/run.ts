import { listByLast } from "./aws-s3";
import { backup } from "./backup";
import { env } from "./env";

const run = async () => {
  try {
    await listByLast();
  } catch (error) {
    console.error("Error while running backup: ", error)
  }
}

run();
