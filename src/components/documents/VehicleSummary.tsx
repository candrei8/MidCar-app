'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VehicleDocumentData } from '@/lib/documents/document-types';

interface VehicleSummaryProps {
  vehicle: VehicleDocumentData;
  showPrice?: boolean;
  price?: number;
  /**
   * Si se pasa, la tarjeta muestra campos editables de matrícula y bastidor.
   * Los cambios se propagan al documento y (al guardar/descargar) a la ficha
   * del vehículo en inventario.
   */
  onIdentityChange?: (identity: { matricula: string; bastidor: string }) => void;
}

export function VehicleSummary({ vehicle, showPrice = false, price, onIdentityChange }: VehicleSummaryProps) {
  const matriculaMissing = !vehicle.matricula;
  const bastidorMissing = !vehicle.bastidor;

  return (
    <Card className="bg-slate-50 border-slate-200">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-[#135bec] text-white flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-2xl">directions_car</span>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-slate-900">
              {vehicle.marca} {vehicle.modelo}
            </h4>
            {vehicle.version && (
              <p className="text-sm text-slate-600">{vehicle.version}</p>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">pin</span>
                {vehicle.matricula || 'Sin matrícula'}
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">speed</span>
                {vehicle.kilometros.toLocaleString('es-ES')} km
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">local_gas_station</span>
                {vehicle.combustible}
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">event</span>
                {vehicle.fechaMatriculacion}
              </span>
            </div>
          </div>
          {showPrice && price !== undefined && (
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-slate-500 uppercase">Precio</p>
              <p className="text-xl font-bold text-[#135bec]">
                {price.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
              </p>
            </div>
          )}
        </div>

        {/* Identificación del vehículo (editable en el asistente de documentos) */}
        {onIdentityChange ? (
          <div className="mt-4 pt-4 border-t border-slate-200">
            {(matriculaMissing || bastidorMissing) && (
              <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                <span className="material-symbols-outlined text-amber-600 text-base flex-shrink-0">warning</span>
                <p className="text-xs text-amber-800">
                  {matriculaMissing && bastidorMissing
                    ? 'Este vehículo no tiene matrícula ni bastidor registrados.'
                    : matriculaMissing
                      ? 'Este vehículo no tiene matrícula real registrada.'
                      : 'Este vehículo no tiene número de bastidor registrado.'}
                  {' '}Introdúcelos aquí: aparecerán en el documento y se guardarán en la ficha del vehículo.
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vehiculoMatricula">Matrícula *</Label>
                <Input
                  id="vehiculoMatricula"
                  value={vehicle.matricula}
                  onChange={(e) => onIdentityChange({ matricula: e.target.value.toUpperCase(), bastidor: vehicle.bastidor })}
                  placeholder="0000 XXX"
                  className={matriculaMissing ? 'border-amber-400 bg-amber-50/50' : ''}
                />
              </div>
              <div>
                <Label htmlFor="vehiculoBastidor">N.º de bastidor (VIN)</Label>
                <Input
                  id="vehiculoBastidor"
                  value={vehicle.bastidor}
                  onChange={(e) => onIdentityChange({ matricula: vehicle.matricula, bastidor: e.target.value.toUpperCase() })}
                  placeholder="17 caracteres"
                  maxLength={17}
                  className={`font-mono ${bastidorMissing ? 'border-amber-400 bg-amber-50/50' : ''}`}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Bastidor</p>
                <p className="font-mono text-xs text-slate-700 truncate" title={vehicle.bastidor}>
                  {vehicle.bastidor || '—'}
                </p>
              </div>
              {vehicle.color && (
                <div>
                  <p className="text-slate-500">Color</p>
                  <p className="text-slate-700">{vehicle.color}</p>
                </div>
              )}
              {vehicle.potencia && (
                <div>
                  <p className="text-slate-500">Potencia</p>
                  <p className="text-slate-700">{vehicle.potencia} CV</p>
                </div>
              )}
              {vehicle.fechaITV && (
                <div>
                  <p className="text-slate-500">Última ITV</p>
                  <p className="text-slate-700">{vehicle.fechaITV}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
