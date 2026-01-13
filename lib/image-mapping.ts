import path from 'path';
import crypto from 'crypto';
import fs from 'fs/promises';

function getImageFilename(url: string): string {
    if (!url) return '';
    
    const urlPath = url.startsWith('http') 
        ? new URL(url).pathname 
        : url;
    
    const ext = path.extname(urlPath) || '.jpg';
    
    // Создаем хеш из URL для уникального имени файла
    const hash = crypto.createHash('md5').update(url).digest('hex').substring(0, 8);
    
    return `${hash}${ext}`;
}

/**
 * Преобразует внешний URL изображения в локальный путь
 * Проверяет существование файла в статике перед использованием
 */
export async function mapImageUrlToLocal(url: string | null): Promise<string | null> {
    if (!url) return null;
    
    const filename = getImageFilename(url);
    const filePath = path.join(process.cwd(), 'public', 'images', filename);
    
    try {
        // Проверяем, существует ли файл в статике
        await fs.access(filePath);
        return `/images/${filename}`;
    } catch {
        // Файл не существует в статике
        return null;
    }
}

/**
 * Преобразует массив URL в локальные пути с проверкой существования
 */
export async function mapImageUrlsToLocal<T extends { hero_image_url: string | null }>(
    data: T[]
): Promise<T[]> {
    const mappedData: T[] = [];
    
    for (const row of data) {
        const localUrl = await mapImageUrlToLocal(row.hero_image_url);
        mappedData.push({
            ...row,
            hero_image_url: localUrl,
        } as T);
    }
    
    return mappedData;
}
