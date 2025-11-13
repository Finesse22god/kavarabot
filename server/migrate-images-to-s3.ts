import { promises as fs } from "fs";
import path from "path";
import { AppDataSource } from "./database";
import { Product } from "./entities/Product";
import { Box } from "./entities/Box";
import { uploadToS3 } from "./s3";

/**
 * Миграция изображений из локальной папки public/uploads в S3
 * Автоматически обновляет URLs в базе данных
 */
export async function migrateImagesToS3(): Promise<void> {
  console.log("\n🔄 Начинаем миграцию изображений в S3...");

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  
  // Проверяем существует ли папка uploads
  try {
    await fs.access(uploadDir);
  } catch {
    console.log("✅ Папка public/uploads не найдена - миграция не требуется");
    return;
  }

  try {
    // Читаем все файлы из папки uploads
    const files = await fs.readdir(uploadDir);
    
    if (files.length === 0) {
      console.log("✅ Папка public/uploads пуста - миграция не требуется");
      return;
    }

    console.log(`📦 Найдено ${files.length} файлов для миграции`);

    // Создаем карту старых URL → новых S3 URL
    const urlMapping = new Map<string, string>();
    let uploadedCount = 0;

    // Загружаем каждый файл в S3
    for (const filename of files) {
      const filePath = path.join(uploadDir, filename);
      const stat = await fs.stat(filePath);

      // Пропускаем директории
      if (!stat.isFile()) continue;

      try {
        // Читаем файл
        const fileBuffer = await fs.readFile(filePath);
        
        // Определяем папку назначения (boxes или products)
        const folder = filename.startsWith("box-") ? "boxes" : "products";
        
        // Создаем объект файла для uploadToS3
        const file = {
          buffer: fileBuffer,
          originalname: filename,
          mimetype: getMimeType(filename),
        } as Express.Multer.File;

        // Загружаем в S3
        const s3Url = await uploadToS3(file, folder);
        
        // Сохраняем маппинг
        const oldUrl = `/uploads/${filename}`;
        urlMapping.set(oldUrl, s3Url);
        
        uploadedCount++;
        console.log(`  ✓ ${filename} → S3 (${uploadedCount}/${files.length})`);
      } catch (error) {
        console.error(`  ✗ Ошибка загрузки ${filename}:`, error);
      }
    }

    console.log(`\n📸 Загружено файлов в S3: ${uploadedCount}/${files.length}`);

    // Обновляем URLs в базе данных
    if (urlMapping.size > 0) {
      await updateDatabaseUrls(urlMapping);
    }

    console.log("\n✅ Миграция завершена успешно!");
    
    // Опционально: удаляем старые файлы (раскомментируйте если нужно)
    // await cleanupOldFiles(uploadDir, files);
    
  } catch (error) {
    console.error("❌ Ошибка миграции:", error);
    throw error;
  }
}

/**
 * Обновляет URLs в базе данных
 */
async function updateDatabaseUrls(urlMapping: Map<string, string>): Promise<void> {
  console.log("\n🔄 Обновляем URLs в базе данных...");
  
  const productRepo = AppDataSource.getRepository(Product);
  const boxRepo = AppDataSource.getRepository(Box);

  let updatedProducts = 0;
  let updatedBoxes = 0;

  // Обновляем Products
  const products = await productRepo.find();
  for (const product of products) {
    let hasChanges = false;

    // Обновляем imageUrl
    if (product.imageUrl && urlMapping.has(product.imageUrl)) {
      product.imageUrl = urlMapping.get(product.imageUrl)!;
      hasChanges = true;
    }

    // Обновляем images (JSON массив)
    if (product.images && Array.isArray(product.images)) {
      const updatedImages = product.images.map((url) => urlMapping.get(url) || url);
      if (JSON.stringify(product.images) !== JSON.stringify(updatedImages)) {
        product.images = updatedImages;
        hasChanges = true;
      }
    }

    if (hasChanges) {
      await productRepo.save(product);
      updatedProducts++;
    }
  }

  // Обновляем Boxes
  const boxes = await boxRepo.find();
  for (const box of boxes) {
    let hasChanges = false;

    // Обновляем photoUrl
    if (box.photoUrl && urlMapping.has(box.photoUrl)) {
      box.photoUrl = urlMapping.get(box.photoUrl)!;
      hasChanges = true;
    }

    // Обновляем imageUrl (если есть)
    if (box.imageUrl && urlMapping.has(box.imageUrl)) {
      box.imageUrl = urlMapping.get(box.imageUrl)!;
      hasChanges = true;
    }

    if (hasChanges) {
      await boxRepo.save(box);
      updatedBoxes++;
    }
  }

  console.log(`  ✓ Обновлено товаров: ${updatedProducts}`);
  console.log(`  ✓ Обновлено боксов: ${updatedBoxes}`);
}

/**
 * Определяет MIME тип по расширению файла
 */
function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
  };
  return mimeTypes[ext] || "application/octet-stream";
}

/**
 * Удаляет старые файлы из папки uploads (опционально)
 */
async function cleanupOldFiles(uploadDir: string, files: string[]): Promise<void> {
  console.log("\n🗑️  Удаляем старые файлы...");
  let deletedCount = 0;

  for (const filename of files) {
    try {
      const filePath = path.join(uploadDir, filename);
      await fs.unlink(filePath);
      deletedCount++;
    } catch (error) {
      console.error(`  ✗ Не удалось удалить ${filename}`);
    }
  }

  console.log(`  ✓ Удалено файлов: ${deletedCount}/${files.length}`);
}
