'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SenalData, VehicleDocumentData, CustomerData } from '@/lib/documents/document-types';
import { EMPRESA_DATOS } from '@/lib/documents/constants';
import { VehicleSummary } from '../VehicleSummary';

interface SenalFormProps {
  vehicle: VehicleDocumentData;
  customer: CustomerData;
  formData: Partial<SenalData>;
  onChange: (data: Partial<SenalData>) => void;
  suggestedPrice?: number;
}

export function SenalForm({
  vehicle,
  customer,
  formData,
  onChange,
  suggestedPrice = 0
}: SenalFormProps) {
  // Calcular fecha límite por defecto (15 días)
  const defaultLimitDate = new Date();
  defaultLimitDate.setDate(defaultLimitDate.getDate() + 15);

  // Inicializar valores por defecto
  const data: Partial<SenalData> = {
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
    precioTotal: suggestedPrice,
    importeSenal: formData.importeSenal || Math.round(suggestedPrice * 0.1), // 10% por defecto
    cuentaBancaria: formData.cuentaBancaria || EMPRESA_DATOS.cuentaBancaria,
    fechaContrato: formData.fechaContrato || new Date().toISOString().split('T')[0],
    lugarContrato: formData.lugarContrato || EMPRESA_DATOS.localidad,
    fechaLimiteVenta: formData.fechaLimiteVenta || defaultLimitDate.toISOString().split('T')[0],
    ...formData
  };

  // Opciones de porcentaje de señal
  const senalOptions = [
    { percent: 5, label: '5%' },
    { percent: 10, label: '10%' },
    { percent: 15, label: '15%' },
    { percent: 20, label: '20%' }
  ];

  const handleSenalPercentChange = (percent: number) => {
    const importe = Math.round((data.precioTotal || 0) * percent / 100);
    onChange({ ...data, importeSenal: importe });
  };

  const currentPercent = data.precioTotal && data.importeSenal
    ? Math.round(data.importeSenal / data.precioTotal * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Resumen del vehículo */}
      <VehicleSummary
        vehicle={vehicle}
        showPrice={true}
        price={data.precioTotal}
      />

      {/* Condiciones de la reserva */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="material-symbols-outlined text-[#135bec]">bookmark</span>
            Condiciones de la reserva
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="precioTotal">Precio total del vehículo *</Label>
              <div className="relative">
                <Input
                  id="precioTotal"
                  type="number"
                  value={data.precioTotal || ''}
                  onChange={(e) => {
                    const precio = Number(e.target.value) || 0;
                    const senal = Math.round(precio * currentPercent / 100);
                    onChange({ ...data, precioTotal: precio, importeSenal: senal || data.importeSenal });
                  }}
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">€</span>
              </div>
            </div>
            <div>
              <Label htmlFor="importeSenal">Importe de la señal *</Label>
              <div className="relative">
                <Input
                  id="importeSenal"
                  type="number"
                  value={data.importeSenal || ''}
                  onChange={(e) => onChange({ ...data, importeSenal: Number(e.target.value) || 0 })}
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">€</span>
              </div>
            </div>
          </div>

          {/* Selector rápido de porcentaje */}
          <div>
            <Label className="mb-2 block">Porcentaje de señal</Label>
            <div className="flex gap-2">
              {senalOptions.map((opt) => (
                <button
                  key={opt.percent}
                  type="button"
                  onClick={() => handleSenalPercentChange(opt.percent)}
                  className={`flex-1 px-3 py-2 rounded-lg border text-sm transition-all ${
                    currentPercent === opt.percent
                      ? 'border-[#135bec] bg-blue-50 text-[#135bec] font-medium'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Resumen */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-emerald-700">Resto a pagar tras la señal</p>
                <p className="text-2xl font-bold text-emerald-700">
                  {((data.precioTotal || 0) - (data.importeSenal || 0)).toLocaleString('es-ES', {
                    style: 'currency',
                    currency: 'EUR'
                  })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-emerald-700">Señal ({currentPercent}%)</p>
                <p className="text-xl font-semibold text-emerald-700">
                  {(data.importeSenal || 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Datos bancarios */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="material-symbols-outlined text-[#135bec]">account_balance</span>
            Datos bancarios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="cuentaBancaria">Cuenta bancaria para el ingreso *</Label>
            <Input
              id="cuentaBancaria"
              value={data.cuentaBancaria || ''}
              onChange={(e) => onChange({ ...data, cuentaBancaria: e.target.value })}
              placeholder="ES12 1234 5678 9012 3456 7890"
            />
            <p className="text-xs text-slate-500 mt-1">
              Cuenta donde el comprador realizará el ingreso de la señal
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Fecha y lugar */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="material-symbols-outlined text-[#135bec]">calendar_month</span>
            Fecha y plazos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fechaContrato">Fecha del contrato *</Label>
              <Input
                id="fechaContrato"
                type="date"
                value={data.fechaContrato || ''}
                onChange={(e) => onChange({ ...data, fechaContrato: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="lugarContrato">Lugar del contrato *</Label>
              <Input
                id="lugarContrato"
                value={data.lugarContrato || ''}
                onChange={(e) => onChange({ ...data, lugarContrato: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="fechaLimiteVenta">Fecha límite para formalizar la compra *</Label>
              <Input
                id="fechaLimiteVenta"
                type="date"
                value={data.fechaLimiteVenta || ''}
                onChange={(e) => onChange({ ...data, fechaLimiteVenta: e.target.value })}
              />
              <p className="text-xs text-slate-500 mt-1">
                Fecha máxima para completar la compraventa. Si no se formaliza, se aplicarán las penalizaciones.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cláusulas adicionales */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="material-symbols-outlined text-[#135bec]">note_add</span>
            Cláusulas adicionales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={data.clausulasAdicionales || ''}
            onChange={(e) => onChange({ ...data, clausulasAdicionales: e.target.value })}
            placeholder="Ej: Reserva condicionada a la aprobación de financiación..."
            rows={3}
          />
        </CardContent>
      </Card>
    </div>
  );
}
