import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const endpoint = import.meta.env.VITE_S3_ENDPOINT;
const region = import.meta.env.VITE_S3_REGION;
const accessKeyId = import.meta.env.VITE_S3_ACCESS_KEY_ID;
const secretAccessKey = import.meta.env.VITE_S3_SECRET_ACCESS_KEY;
const bucket = import.meta.env.VITE_S3_BUCKET;

if (!endpoint || !region || !accessKeyId || !secretAccessKey || !bucket) {
    console.warn("S3 configuration is missing. File uploads may fail.");
}

export const s3Client = new S3Client({
    endpoint,
    region,
    credentials: {
        accessKeyId,
        secretAccessKey,
    },
    forcePathStyle: true, // Required for Supabase S3
    // @ts-ignore - this is a known fix for the readableStream.getReader error in browser environments
    requestChecksumCalculation: "WHEN_REQUIRED",
});

export const uploadReceipt = async (file: File, path: string) => {
    // Convert File to Uint8Array to avoid readableStream errors in some browser contexts
    const arrayBuffer = await file.arrayBuffer();
    const body = new Uint8Array(arrayBuffer);

    const command = new PutObjectCommand({
        Bucket: bucket,
        Key: path,
        Body: body,
        ContentType: file.type,
    });

    try {
        await s3Client.send(command);
        return path;
    } catch (error) {
        console.error("S3 upload error:", error);
        throw error;
    }
};
