import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";

// Инициализация S3 клиента для Timeweb Cloud Storage
const s3Client = new S3Client({
  region: process.env.S3_REGION || "ru-1",
  endpoint: process.env.S3_ENDPOINT || "https://s3.twcstorage.ru",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
  forcePathStyle: true, // Важно для совместимости с S3-клонами
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "355a4950-kavaraapp";

/**
 * Загружает файл в S3 и возвращает публичный URL
 * @param file - Файл из multer (req.file)
 * @param folder - Папка в бакете (например, 'boxes', 'products')
 * @returns Публичный URL загруженного файла
 */
export async function uploadToS3(
  file: Express.Multer.File,
  folder: string
): Promise<string> {
  // Генерируем уникальное имя файла
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString("hex");
  const extension = file.originalname.split(".").pop() || "jpg";
  const fileName = `${folder}/${folder}-${timestamp}-${randomString}.${extension}`;

  // Определяем Content-Type на основе расширения
  const contentTypeMap: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
  };
  const contentType = contentTypeMap[extension.toLowerCase()] || "application/octet-stream";

  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: file.buffer,
      ContentType: contentType,
      ACL: "public-read", // Делаем файл публично доступным
    });

    await s3Client.send(command);

    // Формируем публичный URL
    const endpoint = process.env.S3_ENDPOINT || "https://s3.twcstorage.ru";
    const publicUrl = `${endpoint}/${BUCKET_NAME}/${fileName}`;

    console.log(`✅ Файл загружен в S3: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error("❌ Ошибка загрузки в S3:", error);
    throw new Error("Не удалось загрузить файл в S3");
  }
}

/**
 * Удаляет файл из S3 по URL
 * @param fileUrl - Полный URL файла в S3
 */
export async function deleteFromS3(fileUrl: string): Promise<void> {
  try {
    // Извлекаем путь к файлу из URL
    // URL формат: https://s3.twcstorage.ru/355a4950-kavaraapp/boxes/box-123456.jpg
    const urlParts = fileUrl.split("/");
    const bucketIndex = urlParts.indexOf(BUCKET_NAME);
    
    if (bucketIndex === -1) {
      console.warn("⚠️  Не удалось определить путь файла из URL:", fileUrl);
      return;
    }

    const fileName = urlParts.slice(bucketIndex + 1).join("/");

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
    });

    await s3Client.send(command);
    console.log(`✅ Файл удалён из S3: ${fileName}`);
  } catch (error) {
    console.error("❌ Ошибка удаления из S3:", error);
    // Не бросаем ошибку, чтобы не блокировать операции
  }
}

/**
 * Удаляет все старые фото и загружает новые в S3
 * @param oldUrls - Массив старых URL для удаления
 * @param newFiles - Массив новых файлов для загрузки
 * @param folder - Папка в бакете
 * @returns Массив публичных URL новых файлов
 */
export async function replacePhotosInS3(
  oldUrls: string[],
  newFiles: Express.Multer.File[],
  folder: string
): Promise<string[]> {
  // Удаляем старые фото (параллельно)
  if (oldUrls.length > 0) {
    await Promise.all(oldUrls.map((url) => deleteFromS3(url)));
  }

  // Загружаем новые фото (параллельно)
  const uploadPromises = newFiles.map((file) => uploadToS3(file, folder));
  const newUrls = await Promise.all(uploadPromises);

  return newUrls;
}
