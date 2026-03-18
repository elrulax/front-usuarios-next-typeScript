"use client"
import TriangleLoader from "@/components/loader";
import { useUser } from "@/contextApi/context-auth";
import { Dispositivo } from "@/zod/device-schema";
import { Lectura } from "@/zod/sensorReading-schema";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import Image from "next/image"
import { Label } from "@/components/ui/label";
import { convertirFechaConHora } from "@/lib/utils";
import { BarChartConsumo } from "@/components/graficos/barChartConsumo";

function normalizarFecha(fecha: Date) {
    const f = new Date(fecha);
    f.setHours(0, 0, 0, 0);
    return f;
}

function obtenerRangoUltimos30Dias() {
    const hoy = normalizarFecha(new Date());
    const inicio = new Date(hoy);
    inicio.setDate(hoy.getDate() - 29);

    return { inicio, fin: hoy };
}

function filtrarLecturasUltimos30Dias(lecturas: Lectura[]) {
    const { inicio, fin } = obtenerRangoUltimos30Dias();

    return lecturas.filter((lectura) => {
        if (!lectura.received_at) return false;
        const fecha = normalizarFecha(new Date(lectura.received_at));
        return fecha >= inicio && fecha <= fin;
    });
}

function obtenerConsumoUltimos30Dias(lecturas: Lectura[]) {
    const lecturasFiltradas = filtrarLecturasUltimos30Dias(lecturas)
        .filter((l) => l.received_at && l.cumulative_water_volume != null)
        .sort((a, b) => {
            const fa = a.received_at ? new Date(a.received_at).getTime() : 0;
            const fb = b.received_at ? new Date(b.received_at).getTime() : 0;
            return fa - fb;
        });

    if (lecturasFiltradas.length < 2) return 0;

    const primera = lecturasFiltradas[0];
    const ultima = lecturasFiltradas[lecturasFiltradas.length - 1];

    const volInicial = primera.cumulative_water_volume ?? 0;
    const volFinal = ultima.cumulative_water_volume ?? 0;

    return volFinal - volInicial;
}

function obtenerTextoRangoUltimos30Dias() {
    const { inicio, fin } = obtenerRangoUltimos30Dias();

    const textoInicio = inicio.toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });

    const textoFin = fin.toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });

    return `Del ${textoInicio} al ${textoFin}`;
}

export default function PageInfoCompletaDispositivo() {
    const { id } = useParams()
    const idNumber = id ? Number(id) : undefined
    const { clearUser } = useUser()

    const [dispositivo, setDispositivo] = useState<Dispositivo | undefined>(undefined)
    const [lectura, setLectura] = useState<Lectura | undefined>(undefined)
    const [lecturas, setLecturas] = useState<Lectura[]>([])

    const [loadingDispositivo, setLoadingDipositivo] = useState(true)
    const [loadingRespuesta, setLoadingRespuesta] = useState(true)
    const [loadingLecturas, setLoadingLecturas] = useState(true)

    useEffect(() => {
        async function fetchDispositivo() {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/device/obtenerDispositivo/${idNumber}`, {
                    method: 'GET',
                    credentials: 'include'
                })

                if (response.status === 401) {
                    clearUser()
                    return
                }

                if (response.ok) {
                    const data: Dispositivo = await response.json()
                    setDispositivo(data)
                    setLoadingDipositivo(false)
                } else {
                    toast.error("Error al obtener el dispositivo")
                    setLoadingDipositivo(false)
                }

            } catch (error) {
                console.log(error)
                setLoadingDipositivo(false)
            }
        }

        fetchDispositivo()
    }, [idNumber, clearUser])

    useEffect(() => {
        if (!dispositivo?.dev_num_ser) return

        async function fetchLectura() {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/response/consultarLecturaRecientePorDevice/${dispositivo.dev_num_ser}`, {
                    method: 'GET',
                    credentials: 'include'
                })

                if (response.status === 401) {
                    clearUser()
                    return
                }

                if (response.ok) {
                    const data: Lectura = await response.json()
                    setLectura(data)
                    setLoadingRespuesta(false)
                } else {
                    toast.error("Error al obtener la lectura reciente")
                    setLoadingRespuesta(false)
                }
            } catch (error) {
                console.log(error)
                setLoadingRespuesta(false)
            }
        }

        async function fetchLecturasDispositivio() {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/response//obtenerLecturasPorEUI/${dispositivo.dev_num_ser}`, {
                    method: 'GET',
                    credentials: 'include'
                })

                if (response.status === 401) {
                    clearUser()
                    return
                }

                if (response.ok) {
                    const data: Lectura[] = await response.json()
                    setLecturas(data)
                    setLoadingLecturas(false)
                } else {
                    toast.error("Error al obtener las lecturas")
                    setLoadingLecturas(false)
                }
            } catch (error) {
                console.log(error)
                setLoadingLecturas(false)
            }
        }

        fetchLectura()
        fetchLecturasDispositivio()
    }, [dispositivo, clearUser])

    const lecturasUltimos30Dias = useMemo(() => {
        return filtrarLecturasUltimos30Dias(lecturas);
    }, [lecturas]);

    const consumoUltimos30Dias = useMemo(() => {
        return obtenerConsumoUltimos30Dias(lecturas);
    }, [lecturas]);

    const textoRango = useMemo(() => {
        return obtenerTextoRangoUltimos30Dias();
    }, []);

    return (
        <div>
            {loadingDispositivo || loadingRespuesta || loadingLecturas ? (
                <TriangleLoader />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 w-full gap-5">

                    <div className="grid grid-rows-1 w-full gap-3">
                        <div>
                            <Image src={"/imgs/logoCentenario.jpg"} width={500} height={100} alt="logo" />
                        </div>

                        <div className="w-full h-fit flex flex-col gap-3 rounded-2xl bg-gray-200 p-7">
                            <Label className="text-3xl font-bold">Consumo</Label>
                            <Label className="text-base text-gray-600">{textoRango}</Label>

                            <BarChartConsumo
                                lecturas={lecturasUltimos30Dias}
                                titulo="Consumo de los últimos 30 días"
                                subtitulo="Visualización diaria del consumo hasta hoy"
                                footerTexto="Periodo móvil de 30 días"
                            />
                        </div>
                    </div>

                    <div className="grid grid-rows-1 w-full gap-8">
                        <div className="w-full h-fit flex flex-col gap-5 rounded-2xl p-3">

                            <div className="w-full h-fit flex flex-col gap-2 rounded-2xl bg-gray-200 p-4">
                                <Label className="text-3xl font-bold">
                                    MEDIDOR: {dispositivo?.dev_nombre?.toUpperCase()}
                                </Label>

                                <div className="mt-1">
                                    <Label className="text-2xl">
                                        Número de serie: {dispositivo?.dev_num_ser}
                                    </Label>
                                </div>
                            </div>

                            <div className="w-full h-fit flex flex-col gap-2 rounded-2xl bg-gray-200 p-4">
                                <Label className="text-3xl font-bold">Ubicación</Label>

                                <div className="mt-1">
                                    <Label className="text-2xl">Latitud: {dispositivo?.dev_lat}</Label>
                                </div>

                                <div className="mt-1">
                                    <Label className="text-2xl">Longitud: {dispositivo?.dev_long}</Label>
                                </div>
                            </div>

                            <div className="rounded-2xl bg-gray-200 p-4">
                                <Label className="text-3xl font-bold">Resumen al día de hoy</Label>

                                <div className="mt-3">
                                    <Label className="text-2xl">
                                        Última lectura: {lectura?.cumulative_water_volume}
                                    </Label>
                                </div>

                                <div className="mt-3">
                                    <Label className="text-2xl">
                                        Fecha y hora de última lectura: {convertirFechaConHora(lectura?.received_at)}
                                    </Label>
                                </div>

                                <div className="mt-3">
                                    <Label className="text-2xl">
                                        Consumo de los últimos 30 días: {Number(consumoUltimos30Dias.toFixed(2))}
                                    </Label>
                                </div>

                                <div className="mt-3">
                                    <Label className="text-2xl">
                                        Temperatura del agua (°C): {lectura?.water_temperature}
                                    </Label>
                                </div>

                                <div className="mt-3">
                                    <Label className="text-2xl">
                                        Estado de la válvula: {lectura ? (lectura.valve_is_open ? 'Abierta' : (lectura.valve_is_closed ? 'Cerrada' : "Error")) : ' - '}
                                    </Label>
                                </div>

                                <div className="mt-3">
                                    <Label className="text-2xl">
                                        Flujo instantáneo del agua: {lectura?.instantaneous_flow}
                                    </Label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}