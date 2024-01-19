import { exec } from "child_process";
import { unlink } from "fs";
import { env } from "./env";
import { uploadToS3 } from "./aws-s3";

const dumpToFile = async (path: string): Promise<void> => {
  console.log(`Dumping database to file at ${path}...`);

  await new Promise((resolve, reject) => {
    const command = `mysqldump --host=${env.BACKUP_DATABASE_HOST} --port=${env.BACKUP_DATABASE_PORT} --user=${env.BACKUP_DATABASE_USER} --password=${env.BACKUP_DATABASE_PASSWORD} ${env.BACKUP_DATABASE_NAME} > ${path}`

    exec(
      command
      ,
      (error, stdout, stderr) => {
        if (error) {
          reject({ error: JSON.stringify(error), stderr });
          return;
        }

        resolve(undefined);
      }
    );
  });

  console.log("Dump created.");
}

const deleteFile = async (path: string): Promise<void> => {
  console.log(`Deleting local file at ${path}...`);

  await new Promise((resolve, reject) => {
    unlink(path, (err) => {
      reject({ error: JSON.stringify(err) });
      return;
    });
    resolve(undefined);
  });

  console.log("Local dump file deleted.");
}

const compressingFile = async (path: string,compressedFilePath:string) => {
  console.log(`Dumping database to file at ${compressedFilePath}...`);

  await new Promise((resolve, reject) => {
    const gzipCommand = `gzip -c  ${path} > ${compressedFilePath}`
    exec(gzipCommand
      ,
      (error, stdout, stderr) => {
        if (error) {
          reject({ error: JSON.stringify(error), stderr });
          return;
        }

        resolve(undefined);
      }
    );
  });
}

export const backup = async (): Promise<void> => {
  console.log(`Starting "${env.BACKUP_DATABASE_NAME}" database backup...`)

  const timestamp = new Date().toISOString().replace(/[:.]+/g, '-');

  const filename = `backup-${env.BACKUP_DATABASE_NAME}-${timestamp}.sql`;
  const dumpFilePath = `./tmp/${filename}`;
  const compressedFilePath= `${dumpFilePath}.gz`

  await dumpToFile(dumpFilePath);

  await compressingFile(dumpFilePath, compressedFilePath);

  await uploadToS3({name: filename, path: compressedFilePath});
  await deleteFile(dumpFilePath);
  await deleteFile(compressedFilePath);

  console.log("Database backup complete!")
}
