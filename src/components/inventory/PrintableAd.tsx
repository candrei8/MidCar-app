"use client"

import { QRCodeSVG } from 'qrcode.react'
import { formatCurrency } from "@/lib/utils"
import type { Vehicle } from "@/types"

interface PrintableAdProps {
    vehicle: Vehicle
    webUrl?: string
    showFinancing?: boolean
    companyInfo?: {
        name: string
        phone: string
        address?: string
        logo?: string
    }
}

export function PrintableAd({
    vehicle,
    webUrl,
    showFinancing = true,
    companyInfo = {
        name: "MidCar",
        phone: "91 123 45 67",
        address: "C/ Principal 123, Madrid"
    }
}: PrintableAdProps) {
    const precioFinal = vehicle.precio_venta - vehicle.descuento
    const qrUrl = webUrl || `https://midcar.es/vehiculos/${vehicle.matricula.replace(/\s/g, '')}`

    // Calculate monthly payment (simple approximation: 60 months, 7% TAE)
    const monthlyPayment = showFinancing ? Math.round(precioFinal / 60 * 1.07) : null

    return (
        <div
            className="printable-ad bg-white text-black p-8 w-[210mm] min-h-[297mm] mx-auto"
            style={{
                fontFamily: 'Arial, sans-serif',
                boxSizing: 'border-box',
            }}
        >
            {/* Header with company name */}
            <div className="text-center mb-4 pb-4 border-b-2 border-gray-200">
                <h1 className="text-3xl font-bold text-gray-800">{companyInfo.name}</h1>
                <p className="text-gray-500 text-sm">{companyInfo.address}</p>
            </div>

            {/* Main Image */}
            <div
                className="w-full h-[200mm] bg-cover bg-center rounded-lg mb-6"
                style={{
                    backgroundImage: `url(${vehicle.imagen_principal})`,
                    backgroundColor: '#f3f4f6'
                }}
            />

            {/* Vehicle Info */}
            <div className="text-center mb-6">
                <h2 className="text-4xl font-bold text-gray-900 mb-2">
                    {vehicle.marca} {vehicle.modelo}
                </h2>
                <p className="text-xl text-gray-600">{vehicle.version}</p>
            </div>

            {/* Key Specs */}
            <div className="grid grid-cols-4 gap-4 mb-6 py-4 border-y border-gray-200">
                <div className="text-center">
                    <p className="text-3xl font-bold text-gray-800">{vehicle.año_matriculacion}</p>
                    <p className="text-sm text-gray-500 uppercase">Año</p>
                </div>
                <div className="text-center">
                    <p className="text-3xl font-bold text-gray-800">{(vehicle.kilometraje / 1000).toFixed(0)}k</p>
                    <p className="text-sm text-gray-500 uppercase">Kilómetros</p>
                </div>
                <div className="text-center">
                    <p className="text-3xl font-bold text-gray-800 capitalize">{vehicle.combustible}</p>
                    <p className="text-sm text-gray-500 uppercase">Combustible</p>
                </div>
                <div className="text-center">
                    <p className="text-3xl font-bold text-gray-800 capitalize">{vehicle.transmision}</p>
                    <p className="text-sm text-gray-500 uppercase">Cambio</p>
                </div>
            </div>

            {/* Price Section */}
            <div className="text-center mb-6 py-6 bg-gray-50 rounded-xl">
                {vehicle.descuento > 0 && (
                    <p className="text-xl text-gray-400 line-through mb-1">
                        {formatCurrency(vehicle.precio_venta)}
                    </p>
                )}
                <p className="text-6xl font-bold text-red-600 mb-2">
                    {formatCurrency(precioFinal)}
                </p>
                {showFinancing && monthlyPayment && (
                    <p className="text-lg text-gray-600">
                        Desde <span className="font-bold text-gray-800">{monthlyPayment} €/mes</span> financiado*
                    </p>
                )}
            </div>

            {/* Additional Info */}
            <div className="grid grid-cols-3 gap-4 mb-6 text-center text-sm">
                {vehicle.potencia_cv && (
                    <div className="p-3 bg-gray-100 rounded-lg">
                        <p className="font-bold text-gray-800">{vehicle.potencia_cv} CV</p>
                        <p className="text-gray-500">Potencia</p>
                    </div>
                )}
                {vehicle.etiqueta_dgt && vehicle.etiqueta_dgt !== 'SIN' && (
                    <div className="p-3 bg-gray-100 rounded-lg">
                        <p className="font-bold text-gray-800">Etiqueta {vehicle.etiqueta_dgt}</p>
                        <p className="text-gray-500">DGT</p>
                    </div>
                )}
                {vehicle.garantia_meses && (
                    <div className="p-3 bg-gray-100 rounded-lg">
                        <p className="font-bold text-gray-800">{vehicle.garantia_meses} meses</p>
                        <p className="text-gray-500">Garantía</p>
                    </div>
                )}
            </div>

            {/* Footer with QR */}
            <div className="flex items-center justify-between pt-6 border-t-2 border-gray-200">
                <div>
                    <p className="text-2xl font-bold text-gray-800">{companyInfo.name}</p>
                    <p className="text-xl text-gray-600">{companyInfo.phone}</p>
                    <p className="text-sm text-gray-500 mt-2">
                        Escanea el código QR para más información
                    </p>
                </div>
                <div className="flex flex-col items-center">
                    <QRCodeSVG
                        value={qrUrl}
                        size={120}
                        level="H"
                        includeMargin={true}
                    />
                    <p className="text-xs text-gray-400 mt-1">Ver ficha completa</p>
                </div>
            </div>

            {/* Legal disclaimer */}
            {showFinancing && (
                <p className="text-xs text-gray-400 mt-4 text-center">
                    *Ejemplo de financiación a 60 meses. TAE 7,9%. Sujeto a aprobación.
                </p>
            )}

            {/* Print-specific styles */}
            <style jsx>{`
                @media print {
                    .printable-ad {
                        width: 210mm !important;
                        min-height: 297mm !important;
                        padding: 10mm !important;
                        margin: 0 !important;
                        box-shadow: none !important;
                    }
                }
            `}</style>
        </div>
    )
}
