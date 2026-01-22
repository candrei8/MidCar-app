'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { VehicleDocumentData } from '@/lib/documents/document-types';

interface VehicleSummaryProps {
  vehicle: VehicleDocumentData;
  showPrice?: boolean;
  price?: number;
}

export function VehicleSummary({ vehicle, showPrice = false, price }: VehicleSummaryProps) {
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
                {vehicle.matricula}
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

        {/* Detalles adicionales */}
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-slate-500">Bastidor</p>
              <p className="font-mono text-xs text-slate-700 truncate" title={vehicle.bastidor}>
                {vehicle.bastidor}
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
      </CardContent>
    </Card>
  );
}
