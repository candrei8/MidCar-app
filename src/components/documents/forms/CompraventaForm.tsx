'use client';

import React, { useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CompraventaData, VehicleDocumentData, CustomerData, EconomicConditions } from '@/lib/documents/document-types';
import { FORMA_PAGO_OPTIONS, GARANTIA_OPTIONS, IVA_PERCENT, EMPRESA_DATOS } from '@/lib/documents/constants';
import { VehicleSummary } from '../VehicleSummary';

interface CompraventaFormProps {
  vehicle: VehicleDocumentData;
  customer: CustomerData;
  formData: Partial<CompraventaData>;
  onChange: (data: Partial<CompraventaData>) => void;
  suggestedPrice?: number;
}

export function CompraventaForm({
  vehicle,
  customer,
  formData,
  onChange,
  suggestedPrice = 0
}: CompraventaFormProps) {
  const initializedRef = useRef(false);

  // Inicializar valores por defecto
  const data: Partial<CompraventaData> = {
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
    garantia: {
      meses: 12,
      kilometros: 12000,
      ...formData.garantia
    },
    accesorios: {
      ruedaRepuesto: true,
      gato: true,
      llavesRepuesto: false,
      manuales: true,
      ...formData.accesorios
    },
    documentacion: {
      fichaInspeccionTecnica: true,
      permisoCirculacion: true,
      ultimoReciboPagado: true,
      ...formData.documentacion
    },
    fechaContrato: formData.fechaContrato || new Date().toISOString().split('T')[0],
    lugarContrato: formData.lugarContrato || EMPRESA_DATOS.localidad,
    fechaEntrega: formData.fechaEntrega || new Date().toISOString().split('T')[0],
    lugarEntrega: formData.lugarEntrega || `${EMPRESA_DATOS.direccion}, ${EMPRESA_DATOS.localidad}`,
    ...formData
  };

  // Propagar valores por defecto al padre al montar el componente
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      // Solo propagar si no hay datos ya establecidos
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
    } else if (field === 'formaPago') {
      newCondiciones.formaPago = value as EconomicConditions['formaPago'];
    } else if (field === 'cuentaBancaria') {
      newCondiciones.cuentaBancaria = value as string;
    } else if (field === 'detallesPago') {
      newCondiciones.detallesPago = value as string;
    }

    onChange({ ...data, condiciones: newCondiciones });
  };

  const handleGarantiaChange = (meses: number, kilometros: number) => {
    onChange({
      ...data,
      garantia: { ...data.garantia, meses, kilometros }
    });
  };

  const handleAccesorioChange = (field: string, value: boolean) => {
    const accesorios = {
      ruedaRepuesto: data.accesorios?.ruedaRepuesto ?? true,
      gato: data.accesorios?.gato ?? true,
      llavesRepuesto: data.accesorios?.llavesRepuesto ?? false,
      manuales: data.accesorios?.manuales ?? true,
      otros: data.accesorios?.otros,
      [field]: value
    };
    onChange({ ...data, accesorios });
  };

  const handleDocumentacionChange = (field: string, value: boolean) => {
    const documentacion = {
      fichaInspeccionTecnica: data.documentacion?.fichaInspeccionTecnica ?? true,
      permisoCirculacion: data.documentacion?.permisoCirculacion ?? true,
      ultimoReciboPagado: data.documentacion?.ultimoReciboPagado ?? true,
      [field]: value
    };
    onChange({ ...data, documentacion });
  };

  return (
    <div className="space-y-6">
      {/* Resumen del vehículo */}
      <VehicleSummary
        vehicle={vehicle}
        showPrice={true}
        price={data.condiciones?.totalConIva}
      />

      {/* Condiciones económicas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="material-symbols-outlined text-[#135bec]">payments</span>
            Condiciones económicas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="col-span-2">
              <Label htmlFor="precioVenta">Precio de venta (IVA incluido) *</Label>
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
                value={data.condiciones?.baseImponible?.toLocaleString('es-ES') || '0'}
                disabled
                className="bg-slate-50"
              />
            </div>
            <div>
              <Label>IVA ({IVA_PERCENT}%)</Label>
              <Input
                value={data.condiciones?.ivaImporte?.toLocaleString('es-ES') || '0'}
                disabled
                className="bg-slate-50"
              />
            </div>
          </div>

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

          <div>
            <Label htmlFor="detallesPago">Detalles adicionales del pago</Label>
            <Textarea
              id="detallesPago"
              value={data.condiciones?.detallesPago || ''}
              onChange={(e) => handleCondicionChange('detallesPago', e.target.value)}
              placeholder="Ej: Pago fraccionado, financiación aprobada..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Garantía */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="material-symbols-outlined text-[#135bec]">verified_user</span>
            Garantía
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {GARANTIA_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => handleGarantiaChange(opt.meses, opt.kilometros)}
                className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                  data.garantia?.meses === opt.meses
                    ? 'border-[#135bec] bg-blue-50 text-[#135bec] font-medium'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="mt-4">
            <Label htmlFor="garantiaDescripcion">Observaciones de garantía</Label>
            <Textarea
              id="garantiaDescripcion"
              value={data.garantia?.descripcion || ''}
              onChange={(e) => onChange({
                ...data,
                garantia: { ...data.garantia!, descripcion: e.target.value }
              })}
              placeholder="Ej: Garantía mecánica y eléctrica según contrato..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Fecha y lugar */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="material-symbols-outlined text-[#135bec]">calendar_month</span>
            Fecha y lugar
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
            <div>
              <Label htmlFor="fechaEntrega">Fecha de entrega *</Label>
              <Input
                id="fechaEntrega"
                type="date"
                value={data.fechaEntrega || ''}
                onChange={(e) => onChange({ ...data, fechaEntrega: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="lugarEntrega">Lugar de entrega *</Label>
              <Input
                id="lugarEntrega"
                value={data.lugarEntrega || ''}
                onChange={(e) => onChange({ ...data, lugarEntrega: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accesorios y documentación */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="material-symbols-outlined text-[#135bec]">inventory_2</span>
              Accesorios incluidos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { id: 'ruedaRepuesto', label: 'Rueda de repuesto' },
              { id: 'gato', label: 'Gato y herramientas' },
              { id: 'llavesRepuesto', label: 'Llaves de repuesto' },
              { id: 'manuales', label: 'Manuales del vehículo' }
            ].map((item) => (
              <div key={item.id} className="flex items-center gap-2">
                <Checkbox
                  id={item.id}
                  checked={(data.accesorios as Record<string, boolean | string | undefined>)?.[item.id] as boolean || false}
                  onCheckedChange={(checked) =>
                    handleAccesorioChange(item.id, !!checked)
                  }
                />
                <Label htmlFor={item.id} className="cursor-pointer">{item.label}</Label>
              </div>
            ))}
            <div className="pt-2">
              <Label htmlFor="otrosAccesorios">Otros accesorios</Label>
              <Input
                id="otrosAccesorios"
                value={data.accesorios?.otros || ''}
                onChange={(e) => onChange({
                  ...data,
                  accesorios: { ...data.accesorios!, otros: e.target.value }
                })}
                placeholder="Alfombrillas, cargador..."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="material-symbols-outlined text-[#135bec]">folder_open</span>
              Documentación entregada
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { id: 'fichaInspeccionTecnica', label: 'Ficha de Inspección Técnica' },
              { id: 'permisoCirculacion', label: 'Permiso de Circulación' },
              { id: 'ultimoReciboPagado', label: 'Último recibo del Impuesto' }
            ].map((item) => (
              <div key={item.id} className="flex items-center gap-2">
                <Checkbox
                  id={item.id}
                  checked={(data.documentacion as Record<string, boolean>)?.[item.id] || false}
                  onCheckedChange={(checked) =>
                    handleDocumentacionChange(item.id, !!checked)
                  }
                />
                <Label htmlFor={item.id} className="cursor-pointer">{item.label}</Label>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

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
            placeholder="Añade aquí cualquier cláusula adicional que quieras incluir en el contrato..."
            rows={3}
          />
        </CardContent>
      </Card>
    </div>
  );
}
