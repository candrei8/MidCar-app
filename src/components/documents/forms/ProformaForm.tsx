'use client';

import React, { useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProformaData, VehicleDocumentData, CustomerData, EconomicConditions } from '@/lib/documents/document-types';
import { FORMA_PAGO_OPTIONS, IVA_PERCENT, EMPRESA_DATOS } from '@/lib/documents/constants';
import { VehicleSummary } from '../VehicleSummary';

interface ProformaFormProps {
  vehicle: VehicleDocumentData;
  customer: CustomerData;
  formData: Partial<ProformaData>;
  onChange: (data: Partial<ProformaData>) => void;
  suggestedPrice?: number;
}

// Generar número de proforma único
function generateProformaNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `PF-${year}-${random}`;
}

export function ProformaForm({
  vehicle,
  customer,
  formData,
  onChange,
  suggestedPrice = 0
}: ProformaFormProps) {
  const initializedRef = useRef(false);

  // Inicializar valores por defecto
  const data: Partial<ProformaData> = {
    vehiculo: vehicle,
    comprador: customer,
    vendedor: {
      nombre: EMPRESA_DATOS.nombre,
      apellidos: '',
      dni: EMPRESA_DATOS.cif,
      direccion: EMPRESA_DATOS.direccion,
      codigoPostal: EMPRESA_DATOS.codigoPostal,
      localidad: EMPRESA_DATOS.localidad,
      provincia: EMPRESA_DATOS.provincia,
      telefono: EMPRESA_DATOS.telefono,
      email: EMPRESA_DATOS.email,
      isEmpresa: true,
      nombreEmpresa: EMPRESA_DATOS.nombre,
      cifEmpresa: EMPRESA_DATOS.cif
    },
    condiciones: {
      precioVenta: suggestedPrice,
      baseImponible: Math.round(suggestedPrice / 1.21 * 100) / 100,
      ivaPercent: IVA_PERCENT,
      ivaImporte: Math.round((suggestedPrice - suggestedPrice / 1.21) * 100) / 100,
      totalConIva: suggestedPrice,
      formaPago: 'transferencia',
      cuentaBancaria: EMPRESA_DATOS.cuentaBancaria,
      ...formData.condiciones
    },
    numeroProforma: formData.numeroProforma || generateProformaNumber(),
    numeroFactura: formData.numeroFactura || '', // Se dejará vacío
    fechaProforma: formData.fechaProforma || new Date().toISOString().split('T')[0],
    fechaFactura: formData.fechaFactura || new Date().toISOString().split('T')[0],
    validezDias: formData.validezDias || 15,
    importeReserva: formData.importeReserva || Math.round(suggestedPrice * 0.1),
    ...formData
  };

  // Propagar valores por defecto al padre al montar el componente
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      if (!formData.condiciones?.totalConIva) {
        onChange(data);
      }
    }
  }, []);

  const handleCondicionChange = (field: keyof EconomicConditions, value: number | string) => {
    const newCondiciones = { ...data.condiciones } as EconomicConditions;

    if (field === 'precioVenta' || field === 'totalConIva') {
      const precio = Number(value) || 0;
      newCondiciones.precioVenta = precio;
      newCondiciones.totalConIva = precio;
      newCondiciones.baseImponible = Math.round(precio / 1.21 * 100) / 100;
      newCondiciones.ivaImporte = Math.round((precio - newCondiciones.baseImponible) * 100) / 100;
      // Actualizar también el importe de reserva sugerido
      const newReserva = Math.round(precio * 0.1);
      onChange({
        ...data,
        condiciones: newCondiciones,
        importeReserva: data.importeReserva === Math.round((data.condiciones?.totalConIva || 0) * 0.1)
          ? newReserva
          : data.importeReserva
      });
      return;
    } else if (field === 'formaPago') {
      newCondiciones.formaPago = value as EconomicConditions['formaPago'];
    } else if (field === 'cuentaBancaria') {
      newCondiciones.cuentaBancaria = value as string;
    } else if (field === 'detallesPago') {
      newCondiciones.detallesPago = value as string;
    }

    onChange({ ...data, condiciones: newCondiciones });
  };

  // Opciones de validez
  const validezOptions = [
    { dias: 7, label: '7 días' },
    { dias: 15, label: '15 días' },
    { dias: 30, label: '30 días' },
    { dias: 60, label: '60 días' }
  ];

  return (
    <div className="space-y-6">
      {/* Aviso de proforma */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
        <span className="material-symbols-outlined text-amber-600 flex-shrink-0">info</span>
        <div>
          <p className="font-medium text-amber-800">Documento no fiscal</p>
          <p className="text-sm text-amber-700">
            La factura proforma es un presupuesto previo que no tiene validez fiscal.
            No justifica la venta del vehículo hasta que se formalice el pago.
          </p>
        </div>
      </div>

      {/* Resumen del vehículo */}
      <VehicleSummary
        vehicle={vehicle}
        showPrice={true}
        price={data.condiciones?.totalConIva}
      />

      {/* Datos de la proforma */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="material-symbols-outlined text-[#135bec]">description</span>
            Datos de la proforma
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="numeroProforma">Número de proforma *</Label>
              <Input
                id="numeroProforma"
                value={data.numeroProforma || ''}
                onChange={(e) => onChange({ ...data, numeroProforma: e.target.value })}
                placeholder="PF-2024-0001"
              />
            </div>
            <div>
              <Label htmlFor="fechaProforma">Fecha de emisión *</Label>
              <Input
                id="fechaProforma"
                type="date"
                value={data.fechaProforma || ''}
                onChange={(e) => onChange({ ...data, fechaProforma: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Desglose económico */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="material-symbols-outlined text-[#135bec]">calculate</span>
            Desglose económico
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="col-span-2">
              <Label htmlFor="precioVenta">Importe total (IVA incluido) *</Label>
              <div className="relative">
                <Input
                  id="precioVenta"
                  type="number"
                  value={data.condiciones?.totalConIva || ''}
                  onChange={(e) => handleCondicionChange('precioVenta', e.target.value)}
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">€</span>
              </div>
            </div>
            <div>
              <Label>Base imponible</Label>
              <Input
                value={data.condiciones?.baseImponible?.toLocaleString('es-ES', { minimumFractionDigits: 2 }) || '0'}
                disabled
                className="bg-slate-50"
              />
            </div>
            <div>
              <Label>IVA ({IVA_PERCENT}%)</Label>
              <Input
                value={data.condiciones?.ivaImporte?.toLocaleString('es-ES', { minimumFractionDigits: 2 }) || '0'}
                disabled
                className="bg-slate-50"
              />
            </div>
          </div>

          {/* Resumen visual */}
          <div className="bg-[#135bec]/5 border border-[#135bec]/20 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-slate-600">Importe presupuestado</p>
                <p className="text-3xl font-bold text-[#135bec]">
                  {(data.condiciones?.totalConIva || 0).toLocaleString('es-ES', {
                    style: 'currency',
                    currency: 'EUR'
                  })}
                </p>
              </div>
              <div className="text-right text-sm text-slate-500">
                <p>Base: {(data.condiciones?.baseImponible || 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p>
                <p>IVA: {(data.condiciones?.ivaImporte || 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Importe de reserva */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="material-symbols-outlined text-[#135bec]">savings</span>
            Importe de reserva sugerido
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="importeReserva">Importe para reservar</Label>
              <div className="relative">
                <Input
                  id="importeReserva"
                  type="number"
                  value={data.importeReserva || ''}
                  onChange={(e) => onChange({ ...data, importeReserva: Number(e.target.value) || 0 })}
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">€</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Importe sugerido para reservar el vehículo
              </p>
            </div>
            <div className="flex items-end">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 w-full">
                <p className="text-xs text-emerald-700">Reserva sugerida (10%)</p>
                <p className="text-lg font-semibold text-emerald-700">
                  {(data.importeReserva || 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validez y forma de pago */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="material-symbols-outlined text-[#135bec]">schedule</span>
            Validez y forma de pago
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-2 block">Validez de la proforma</Label>
            <div className="flex gap-2">
              {validezOptions.map((opt) => (
                <button
                  key={opt.dias}
                  type="button"
                  onClick={() => onChange({ ...data, validezDias: opt.dias })}
                  className={`flex-1 px-3 py-2 rounded-lg border text-sm transition-all ${
                    data.validezDias === opt.dias
                      ? 'border-[#135bec] bg-blue-50 text-[#135bec] font-medium'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="formaPago">Forma de pago preferida</Label>
              <select
                id="formaPago"
                value={data.condiciones?.formaPago || 'transferencia'}
                onChange={(e) => handleCondicionChange('formaPago', e.target.value)}
                className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#135bec]"
              >
                {FORMA_PAGO_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="cuentaBancaria">Cuenta bancaria</Label>
              <Input
                id="cuentaBancaria"
                value={data.condiciones?.cuentaBancaria || ''}
                onChange={(e) => handleCondicionChange('cuentaBancaria', e.target.value)}
                placeholder="ES12 1234 5678 9012 3456 7890"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Concepto adicional */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="material-symbols-outlined text-[#135bec]">add_notes</span>
            Observaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={data.conceptoAdicional || ''}
            onChange={(e) => onChange({ ...data, conceptoAdicional: e.target.value })}
            placeholder="Ej: Precios válidos según disponibilidad, incluye garantía de 12 meses..."
            rows={2}
          />
        </CardContent>
      </Card>
    </div>
  );
}
