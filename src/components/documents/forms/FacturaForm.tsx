'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FacturaData, VehicleDocumentData, CustomerData, EconomicConditions } from '@/lib/documents/document-types';
import { FORMA_PAGO_OPTIONS, IVA_PERCENT, EMPRESA_DATOS } from '@/lib/documents/constants';
import { VehicleSummary } from '../VehicleSummary';

interface FacturaFormProps {
  vehicle: VehicleDocumentData;
  customer: CustomerData;
  formData: Partial<FacturaData>;
  onChange: (data: Partial<FacturaData>) => void;
  suggestedPrice?: number;
}

// Generar número de factura único
function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `F-${year}-${random}`;
}

export function FacturaForm({
  vehicle,
  customer,
  formData,
  onChange,
  suggestedPrice = 0
}: FacturaFormProps) {
  // Inicializar valores por defecto
  const data: Partial<FacturaData> = {
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
    numeroFactura: formData.numeroFactura || generateInvoiceNumber(),
    fechaFactura: formData.fechaFactura || new Date().toISOString().split('T')[0],
    ...formData
  };

  const handleCondicionChange = (field: keyof EconomicConditions, value: number | string) => {
    const newCondiciones = { ...data.condiciones } as EconomicConditions;

    if (field === 'precioVenta' || field === 'totalConIva') {
      const precio = Number(value) || 0;
      newCondiciones.precioVenta = precio;
      newCondiciones.totalConIva = precio;
      newCondiciones.baseImponible = Math.round(precio / 1.21 * 100) / 100;
      newCondiciones.ivaImporte = Math.round((precio - newCondiciones.baseImponible) * 100) / 100;
    } else if (field === 'formaPago') {
      newCondiciones.formaPago = value as EconomicConditions['formaPago'];
    } else if (field === 'cuentaBancaria') {
      newCondiciones.cuentaBancaria = value as string;
    } else if (field === 'detallesPago') {
      newCondiciones.detallesPago = value as string;
    }

    onChange({ ...data, condiciones: newCondiciones });
  };

  return (
    <div className="space-y-6">
      {/* Resumen del vehículo */}
      <VehicleSummary
        vehicle={vehicle}
        showPrice={true}
        price={data.condiciones?.totalConIva}
      />

      {/* Datos de la factura */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="material-symbols-outlined text-[#135bec]">receipt</span>
            Datos de la factura
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="numeroFactura">Número de factura *</Label>
              <Input
                id="numeroFactura"
                value={data.numeroFactura || ''}
                onChange={(e) => onChange({ ...data, numeroFactura: e.target.value })}
                placeholder="F-2024-0001"
              />
            </div>
            <div>
              <Label htmlFor="fechaFactura">Fecha de factura *</Label>
              <Input
                id="fechaFactura"
                type="date"
                value={data.fechaFactura || ''}
                onChange={(e) => onChange({ ...data, fechaFactura: e.target.value })}
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
                <p className="text-sm text-slate-600">Total a facturar</p>
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

      {/* Forma de pago */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="material-symbols-outlined text-[#135bec]">payments</span>
            Forma de pago
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="formaPago">Forma de pago *</Label>
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

          <div className="mt-4">
            <Label htmlFor="detallesPago">Observaciones de pago</Label>
            <Textarea
              id="detallesPago"
              value={data.condiciones?.detallesPago || ''}
              onChange={(e) => handleCondicionChange('detallesPago', e.target.value)}
              placeholder="Ej: Pago realizado, nº de transferencia..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Concepto adicional */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="material-symbols-outlined text-[#135bec]">add_notes</span>
            Concepto adicional
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={data.conceptoAdicional || ''}
            onChange={(e) => onChange({ ...data, conceptoAdicional: e.target.value })}
            placeholder="Ej: Incluye gastos de transferencia, garantía extendida..."
            rows={2}
          />
          <p className="text-xs text-slate-500 mt-1">
            Este texto aparecerá como línea adicional en la factura
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
