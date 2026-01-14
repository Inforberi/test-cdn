const CDN = process.env.NEXT_PUBLIC_CDN_URL || 'https://cdn.inforberi.ru';

export function toCdnUrl(src?: string | null) {
    return src || '';
    // if (!src) return '';
    // // если уже абсолютная ссылка — не трогаем
    // if (
    //     src.startsWith('http://') ||
    //     src.startsWith('https://') ||
    //     src.startsWith('data:')
    // )
    //     return src;
    // // если относительная "/..."
    // if (src.startsWith('/')) return `${CDN}${src}`;
    // // если вдруг без "/" (редко)
    // return `${CDN}/${src}`;
}
