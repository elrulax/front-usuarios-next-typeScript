"use client"

import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from "recharts"
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { Lectura } from "@/zod/sensorReading-schema"

type BarChartConsumoProps = {
    lecturas: Lectura[]
    titulo?: string
    subtitulo?: string
    footerTexto?: string
}

const chartConfig = {
    water: {
        label: "Volumen acumulado de agua",
        color: "#76c7c0",
    },
} satisfies ChartConfig

export function BarChartConsumo({
    lecturas,
    titulo = "Consumo diario de agua",
    subtitulo = "Visualización de consumo por día",
    footerTexto = "Consumo diario del periodo mostrado",
}: BarChartConsumoProps) {

    const data = lecturas
        .filter((lectura) => lectura.received_at && lectura.yesterday_cumulative_water_volume != null)
        .map((lectura) => {
            const fechaReal = new Date(lectura.received_at ?? "")

            return {
                fechaReal,
                fecha: fechaReal.toLocaleDateString("es-MX", {
                    month: "short",
                    day: "numeric",
                }),
                consumo: Number(lectura.yesterday_cumulative_water_volume ?? 0),
            }
        })
        .sort((a, b) => a.fechaReal.getTime() - b.fechaReal.getTime())
        .slice(-30)

    return (
        <Card>
            <CardHeader>
                <CardTitle>{titulo}</CardTitle>
                <p className="text-sm text-muted-foreground">{subtitulo}</p>
            </CardHeader>

            <CardContent>
                <ChartContainer config={chartConfig}>
                    <BarChart
                        accessibilityLayer
                        data={data}
                        margin={{ top: 20, left: 12, right: 12 }}
                    >
                        <CartesianGrid vertical={false} />

                        <XAxis
                            dataKey="fecha"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={10}
                        />

                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel />}
                        />

                        <Bar
                            dataKey="consumo"
                            fill="var(--color-water)"
                            radius={8}
                        >
                            <LabelList
                                dataKey="consumo"
                                position="top"
                                offset={8}
                                className="fill-foreground"
                                fontSize={11}
                            />
                        </Bar>
                    </BarChart>
                </ChartContainer>
            </CardContent>

            <CardFooter>
                <div className="flex w-full items-start gap-2 text-sm">
                    <div className="grid gap-2">
                        <div className="text-muted-foreground flex items-center gap-2 leading-none">
                            {footerTexto}
                        </div>
                    </div>
                </div>
            </CardFooter>
        </Card>
    )
}