import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { ExportButtons } from '@/components/export-buttons';
import { mapImageUrlsToLocal } from '@/lib/image-mapping';

interface ProductRow {
    name: string;
    slug_item: string;
    hero_image_url: string | null;
    bedsize: string | null;
    artnum: string | null;
    dimensions: string | null;
}

async function fetchData(): Promise<ProductRow[]> {
    const apiUrl =
        'https://strapi.fiftyfourms.com/api/products?pagination[page]=1&pagination[pageSize]=100000&locale=ru&filters[publishedAt][$notNull]=true&fields=name&fields=slug_item&populate[hero_image][fields]=url&populate[properties][populate][bedsize][populate][bedsize][fields]=name&populate[properties][populate][bedsize][fields]=artnum&populate[details][populate][detailitems][filters][is_main][$eq]=true&populate[details][populate][detailitems][fields]=value';

    const response = await fetch(apiUrl, { cache: 'no-store' });
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

    // Преобразуем URL на локальные пути с проверкой существования файлов в статике
    return await mapImageUrlsToLocal(processedData);
}

export default async function StrapiDataProcessor() {
    const data = await fetchData();

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="mx-auto max-w-7xl space-y-6">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">
                        Обработка данных Strapi
                    </h1>
                    <p className="text-muted-foreground">
                        Загрузка и преобразование данных о товарах из Strapi API
                        в табличный формат
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Управление данными</CardTitle>
                        <CardDescription>
                            Экспортируйте данные в CSV или Excel формат
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex gap-3">
                        <ExportButtons data={data} />
                    </CardContent>
                </Card>

                {data.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Товары</CardTitle>
                            <CardDescription>
                                Показано {data.length} товаров
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {data.map((row, index) => {
                                    const imageUrl = row.hero_image_url;

                                    return (
                                        <Card
                                            key={index}
                                            className="group overflow-hidden transition-all hover:shadow-lg"
                                        >
                                            <div className="relative aspect-square w-full overflow-hidden bg-muted">
                                                {imageUrl ? (
                                                    <Image
                                                        src={imageUrl}
                                                        alt={
                                                            row.name || 'Товар'
                                                        }
                                                        fill
                                                        className="object-cover transition-transform group-hover:scale-105"
                                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                                                    />
                                                ) : (
                                                    <div className="flex h-full items-center justify-center">
                                                        <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
                                                    </div>
                                                )}
                                            </div>
                                            <CardHeader className="pb-3">
                                                <CardTitle className="line-clamp-2 text-base">
                                                    {row.name || 'Без названия'}
                                                </CardTitle>
                                                <CardDescription className="font-mono text-xs">
                                                    {row.slug_item}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-2 pt-0">
                                                {row.bedsize && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-muted-foreground">
                                                            Размер:
                                                        </span>
                                                        <span className="text-sm font-medium">
                                                            {row.bedsize}
                                                        </span>
                                                    </div>
                                                )}
                                                {row.artnum && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-muted-foreground">
                                                            Артикул:
                                                        </span>
                                                        <span className="text-sm font-medium">
                                                            {row.artnum}
                                                        </span>
                                                    </div>
                                                )}
                                                {row.dimensions && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-muted-foreground">
                                                            Габариты:
                                                        </span>
                                                        <span className="text-sm font-medium">
                                                            {row.dimensions}
                                                        </span>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
