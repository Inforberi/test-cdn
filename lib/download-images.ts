import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const PUBLIC_IMAGES_DIR = path.join(process.cwd(), 'public', 'images');

async function ensureDirectoryExists(dirPath: string) {
    try {
        await fs.access(dirPath);
    } catch {
        await fs.mkdir(dirPath, { recursive: true });
    }
}

async function downloadImage(
    url: string,
    filename: string,
    stats: { skipped: number; downloaded: number; failed: number }
): Promise<string | null> {
    try {
        const filePath = path.join(PUBLIC_IMAGES_DIR, filename);
        
        // Проверяем, существует ли файл уже
        try {
            await fs.access(filePath);
            stats.skipped++;
            return `/images/${filename}`;
        } catch {
            // Файл не существует, скачиваем
        }

        const fullUrl = url.startsWith('http') 
            ? url 
            : `https://strapi.fiftyfourms.com${url}`;

        const response = await fetch(fullUrl);
        if (!response.ok) {
            console.warn(`❌ Не удалось скачать: ${fullUrl} (${response.status})`);
            stats.failed++;
            return null;
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Проверяем еще раз перед записью (на случай параллельных запросов)
        try {
            await fs.access(filePath);
            stats.skipped++;
            return `/images/${filename}`;
        } catch {
            // Файл все еще не существует, записываем
        }

        await fs.writeFile(filePath, buffer);
        stats.downloaded++;
        return `/images/${filename}`;
    } catch (error) {
        console.error(`❌ Ошибка при скачивании ${url}:`, error);
        stats.failed++;
        return null;
    }
}

function getImageFilename(url: string): string {
    if (!url) return '';
    
    const urlPath = url.startsWith('http') 
        ? new URL(url).pathname 
        : url;
    
    const ext = path.extname(urlPath) || '.jpg';
    
    // Создаем хеш из URL для уникального имени файла
    const hash = crypto.createHash('md5').update(url).digest('hex').substring(0, 8);
    
    const filename = `${hash}${ext}`;
    
    return filename;
}

export async function downloadAndMapImages(
    data: Array<{ hero_image_url: string | null; slug_item: string }>
): Promise<Map<string, string>> {
    await ensureDirectoryExists(PUBLIC_IMAGES_DIR);

    const imageMap = new Map<string, string>();
    const downloadPromises: Promise<void>[] = [];
    const processedUrls = new Set<string>();
    const stats = { skipped: 0, downloaded: 0, failed: 0 };

    const urlsToProcess: string[] = [];

    // Собираем все уникальные URL
    data.forEach((row) => {
        if (!row.hero_image_url) return;

        if (!processedUrls.has(row.hero_image_url)) {
            processedUrls.add(row.hero_image_url);
            urlsToProcess.push(row.hero_image_url);
        }
    });

    console.log(`📋 Найдено ${urlsToProcess.length} уникальных изображений для обработки`);

    // Обрабатываем все URL с небольшой задержкой между запросами
    for (let i = 0; i < urlsToProcess.length; i++) {
        const url = urlsToProcess[i];
        const filename = getImageFilename(url);
        if (!filename) {
            stats.failed++;
            continue;
        }

        const promise = downloadImage(url, filename, stats).then((localPath) => {
            if (localPath) {
                imageMap.set(url, localPath);
            }
        });

        downloadPromises.push(promise);

        // Небольшая задержка каждые 10 запросов, чтобы не перегружать сервер
        if ((i + 1) % 10 === 0) {
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
    }

    await Promise.all(downloadPromises);

    console.log(`✅ Пропущено (уже существует): ${stats.skipped}`);
    console.log(`⬇️  Скачано новых: ${stats.downloaded}`);
    console.log(`❌ Ошибок: ${stats.failed}`);

    return imageMap;
}
