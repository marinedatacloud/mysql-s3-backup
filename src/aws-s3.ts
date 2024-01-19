import { ListBucketsCommand, PutObjectCommand, S3Client, S3ClientConfig,ListObjectsV2CommandInput,ListObjectsV2CommandOutput, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { createReadStream } from "fs";
import { env } from "./env";

export const uploadToS3 = async (file: {name: string, path: string}): Promise<void> => {
  const bucket = env.AWS_S3_BUCKET;
  const clientOptions: S3ClientConfig = {
    region: env.AWS_S3_REGION,
  };

  console.log(`Uploading backup to S3 at ${bucket}/${file.name}...`);

  if (env.AWS_S3_ENDPOINT) {
    console.log(`Using custom endpoint: ${env.AWS_S3_ENDPOINT}`);

    clientOptions['endpoint'] = env.AWS_S3_ENDPOINT;
  }

  const client = new S3Client(clientOptions);

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: `daily/${file.name}`,
      Body: createReadStream(file.path),
    })
  )

  console.log("Backup uploaded.");
}


export const listByLast = async () => {
  const bucket = env.AWS_S3_BUCKET;
  const clientOptions: S3ClientConfig = {
    region: env.AWS_S3_REGION,
  };

  const client = new S3Client(clientOptions);

  const command = new ListObjectsV2Command({
    Bucket: bucket,
    // The default and maximum number of keys returned is 1000. This limits it to
    // one for demonstration purposes.
    MaxKeys: 1,
    Prefix:"daily/backup-strapi_mdc"
  });

  try {
    let isTruncated:boolean | undefined = true;

    console.log("Your bucket contains the following objects:\n");
    let contents = "";

    while (isTruncated) {
      const { Contents, IsTruncated, NextContinuationToken } = await client.send<ListObjectsV2CommandInput,ListObjectsV2CommandOutput>(command);
      const contentsList = Contents?.map((c) => ` • ${c.Key}`).join("\n");
      contents += contentsList + "\n";
      isTruncated = IsTruncated;
      command.input.ContinuationToken = NextContinuationToken;
    }
    console.log(contents);
  } catch (err) {
    console.error(err);
  }

  console.log("Backup uploaded.");
}