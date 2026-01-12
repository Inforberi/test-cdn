"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, FileSpreadsheet, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import * as XLSX from "xlsx"

interface ProductRow {
  name: string
  slug_item: string
  hero_image_url: string | null
  bedsize: string | null
  artnum: string | null
  dimensions: string | null
}

export default function StrapiDataProcessor() {
  const [data, setData] = useState<ProductRow[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const fetchData = async () => {
    setLoading(true)
    try {
      const apiUrl =
        "https://strapi.fiftyfourms.com/api/products?pagination[page]=1&pagination[pageSize]=100000&locale=ru&filters[publishedAt][$notNull]=true&fields=name&fields=slug_item&populate[hero_image][fields]=url&populate[properties][populate][bedsize][populate][bedsize][fields]=name&populate[properties][populate][bedsize][fields]=artnum&populate[details][populate][detailitems][filters][is_main][$eq]=true&populate[details][populate][detailitems][fields]=value"

      const response = await fetch(apiUrl)
      const result = await response.json()

      const processedData: ProductRow[] = []

      result.data.forEach((product: any) => {
        const name = product.attributes.name
        const slug_item = product.attributes.slug_item
        const hero_image_url = product.attributes.hero_image?.data?.attributes?.url || null
        const bedsizes = product.attributes.properties?.bedsize || []
        const detailitems = product.attributes.details?.detailitems || []

        // If no bedsizes and no dimensions, create one row with nulls
        if (bedsizes.length === 0 && detailitems.length === 0) {
          processedData.push({
            name,
            slug_item,
            hero_image_url,
            bedsize: null,
            artnum: null,
            dimensions: null,
          })
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
            })
          })
        }
        // If has bedsizes but no dimensions, create row for each bedsize
        else if (bedsizes.length > 0 && detailitems.length === 0) {
          bedsizes.forEach((bedsizeItem: any) => {
            processedData.push({
              name,
              slug_item,
              hero_image_url,
              bedsize: bedsizeItem.bedsize?.data?.attributes?.name || null,
              artnum: bedsizeItem.artnum || null,
              dimensions: null,
            })
          })
        }
        // If has both bedsizes and dimensions, create row for each combination
        else {
          bedsizes.forEach((bedsizeItem: any) => {
            detailitems.forEach((detailitem: any) => {
              processedData.push({
                name,
                slug_item,
                hero_image_url,
                bedsize: bedsizeItem.bedsize?.data?.attributes?.name || null,
                artnum: bedsizeItem.artnum || null,
                dimensions: detailitem.value || null,
              })
            })
          })
        }
      })

      setData(processedData)
      toast({
        title: "Успешно загружено",
        description: `Обработано ${processedData.length} строк из ${result.data.length} товаров`,
      })
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные из API",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    const headers = ["name", "slug_item", "hero_image_url", "bedsize", "artnum", "dimensions"]
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header as keyof ProductRow]
            return value === null ? "" : `"${String(value).replace(/"/g, '""')}"`
          })
          .join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", "strapi_products.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Экспорт завершён",
      description: "CSV файл успешно загружен",
    })
  }

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products")
    XLSX.writeFile(workbook, "strapi_products.xlsx")

    toast({
      title: "Экспорт завершён",
      description: "Excel файл успешно загружен",
    })
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Обработка данных Strapi</h1>
          <p className="text-muted-foreground">
            Загрузка и преобразование данных о товарах из Strapi API в табличный формат
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Управление данными</CardTitle>
            <CardDescription>Загрузите данные из API и экспортируйте их в CSV или Excel формат</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button onClick={fetchData} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Загрузка...
                </>
              ) : (
                "Загрузить данные"
              )}
            </Button>
            <Button onClick={exportToCSV} disabled={data.length === 0} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Экспорт в CSV
            </Button>
            <Button onClick={exportToExcel} disabled={data.length === 0} variant="outline">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Экспорт в Excel
            </Button>
          </CardContent>
        </Card>

        {data.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Таблица данных</CardTitle>
              <CardDescription>Всего строк: {data.length}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Название</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>URL изображения</TableHead>
                      <TableHead>Размер</TableHead>
                      <TableHead>Артикул</TableHead>
                      <TableHead>Габариты</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{row.name}</TableCell>
                        <TableCell className="font-mono text-sm">{row.slug_item}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-xs">{row.hero_image_url || "—"}</TableCell>
                        <TableCell>{row.bedsize || "—"}</TableCell>
                        <TableCell>{row.artnum || "—"}</TableCell>
                        <TableCell>{row.dimensions || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
