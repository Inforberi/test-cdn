'use client';

import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

interface ProductRow {
    name: string;
    slug_item: string;
    hero_image_url: string | null;
    bedsize: string | null;
    artnum: string | null;
    dimensions: string | null;
}

interface ExportButtonsProps {
    data: ProductRow[];
}

export function ExportButtons({ data }: ExportButtonsProps) {
    const { toast } = useToast();

    const exportToCSV = () => {
        const headers = [
            'name',
            'slug_item',
            'hero_image_url',
            'bedsize',
            'artnum',
            'dimensions',
        ];
        const csvContent = [
            headers.join(','),
            ...data.map((row) =>
                headers
                    .map((header) => {
                        const value = row[header as keyof ProductRow];
                        return value === null
                            ? ''
                            : `"${String(value).replace(/"/g, '""')}"`;
                    })
                    .join(',')
            ),
        ].join('\n');

        const blob = new Blob([csvContent], {
            type: 'text/csv;charset=utf-8;',
        });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'strapi_products.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
            title: 'Экспорт завершён',
            description: 'CSV файл успешно загружен',
        });
    };

    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
        XLSX.writeFile(workbook, 'strapi_products.xlsx');

        toast({
            title: 'Экспорт завершён',
            description: 'Excel файл успешно загружен',
        });
    };

    return (
        <>
            <Button
                onClick={exportToCSV}
                disabled={data.length === 0}
                variant="outline"
            >
                <Download className="mr-2 h-4 w-4" />
                Экспорт в CSV
            </Button>
            <Button
                onClick={exportToExcel}
                disabled={data.length === 0}
                variant="outline"
            >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Экспорт в Excel
            </Button>
        </>
    );
}
