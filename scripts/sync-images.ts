import { downloadAndMapImages } from '@/lib/download-images';

interface ProductRow {
    name: string;
    slug_item: string;
    hero_image_url: string | null;
    bedsize: string | null;
    artnum: string | null;
    dimensions: string | null;
}

async function fetchAllData(): Promise<ProductRow[]> {
    const apiUrl =
        'https://strapi.fiftyfourms.com/api/products?pagination[page]=1&pagination[pageSize]=100000&locale=ru&filters[publishedAt][$notNull]=true&fields=name&fields=slug_item&populate[hero_image][fields]=url&populate[properties][populate][bedsize][populate][bedsize][fields]=name&populate[properties][populate][bedsize][fields]=artnum&populate[details][populate][detailitems][filters][is_main][$eq]=true&populate[details][populate][detailitems][fields]=value';

    const response = await fetch(apiUrl);
    const result = await response.json();

    const processedData: ProductRow[] = [];

    result.data.forEach((product: any) => {
        const name = product.attributes.name;
        const slug_item = product.attributes.slug_item;
        const hero_image_url =
            product.attributes.hero_image?.data?.attributes?.url || null;
        const bedsizes = product.attributes.properties?.bedsize || [];
        const detailitems = product.attributes.details?.detailitems || [];

        // If no bedsizes and no dimensions, create one row with nulls
        if (bedsizes.length === 0 && detailitems.length === 0) {
            processedData.push({
                name,
                slug_item,
                hero_image_url,
                bedsize: null,
                artnum: null,
                dimensions: null,
            });
        }
        // If no bedsizes but has dimensions, create row for each dimension
        else if (bedsizes.length === 0 && detailitems.length > 0) {
            detailitems.forEach((detailitem: any) => {
                processedData.push({
                    name,
                    slug_item,
                    hero_image_url,
                    bedsize: null,
                    artnum: null,
                    dimensions: detailitem.value || null,
                });
            });
        }
        // If has bedsizes but no dimensions, create row for each bedsize
        else if (bedsizes.length > 0 && detailitems.length === 0) {
            bedsizes.forEach((bedsizeItem: any) => {
                processedData.push({
                    name,
                    slug_item,
                    hero_image_url,
                    bedsize:
                        bedsizeItem.bedsize?.data?.attributes?.name || null,
                    artnum: bedsizeItem.artnum || null,
                    dimensions: null,
                });
            });
        }
        // If has both bedsizes and dimensions, create row for each combination
        else {
            bedsizes.forEach((bedsizeItem: any) => {
                detailitems.forEach((detailitem: any) => {
                    processedData.push({
                        name,
                        slug_item,
                        hero_image_url,
                        bedsize:
                            bedsizeItem.bedsize?.data?.attributes?.name || null,
                        artnum: bedsizeItem.artnum || null,
                        dimensions: detailitem.value || null,
                    });
                });
            });
        }
    });

    return processedData;
}

async function syncImages() {
    console.log('🚀 Начинаем синхронизацию изображений...\n');
    
    const data = await fetchAllData();
    const totalWithImages = data.filter((row) => row.hero_image_url !== null).length;
    console.log(`📊 Обработано ${data.length} записей (${totalWithImages} с изображениями)\n`);
    
    const imageMap = await downloadAndMapImages(data);
    
    console.log(`\n📦 Итого в маппинге: ${imageMap.size} изображений`);
    console.log('✅ Синхронизация завершена!\n');
}

syncImages().catch(console.error);
