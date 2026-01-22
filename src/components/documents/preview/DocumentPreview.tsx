'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DocumentType,
  CompraventaData,
  SenalData,
  FacturaData,
  ProformaData
} from '@/lib/documents/document-types';
import { DOCUMENT_TYPES } from '@/lib/documents/constants';
import { generateCompraventaPDF } from '@/lib/documents/templates/compraventa-template';
import { generateSenalPDF } from '@/lib/documents/templates/senal-template';
import { generateFacturaPDF } from '@/lib/documents/templates/factura-template';
import { generateProformaPDF } from '@/lib/documents/templates/proforma-template';

interface DocumentPreviewProps {
  documentType: DocumentType;
  formData: CompraventaData | SenalData | FacturaData | ProformaData;
  onDownload: () => void;
  onSave?: () => void;
  isGenerating?: boolean;
  isSaving?: boolean;
}

export function DocumentPreview({
  documentType,
  formData,
  onDownload,
  onSave,
  isGenerating = false,
  isSaving = false
}: DocumentPreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const docTypeInfo = DOCUMENT_TYPES.find(d => d.id === documentType);

  useEffect(() => {
    generatePreview();
  }, [documentType, formData]);

  const generatePreview = async () => {
    try {
      setError(null);
      let template;

      switch (documentType) {
        case 'compraventa':
          template = generateCompraventaPDF(formData as CompraventaData);
          break;
        case 'senal':
          template = generateSenalPDF(formData as SenalData);
          break;
        case 'factura':
          template = generateFacturaPDF(formData as FacturaData);
          break;
        case 'proforma':
          template = generateProformaPDF(formData as ProformaData);
          break;
        default:
          throw new Error('Tipo de documento no soportado');
      }

      const dataUrl = template.getDataUrl();
      setPreviewUrl(dataUrl);
    } catch (err) {
      console.error('Error generando preview:', err);
      setError('Error al generar la vista previa del documento');
    }
  };

  const handleDownload = () => {
    try {
      let template;
      let filename = '';

      switch (documentType) {
        case 'compraventa':
          template = generateCompraventaPDF(formData as CompraventaData);
          filename = `Contrato_Compraventa_${(formData as CompraventaData).vehiculo.matricula}.pdf`;
          break;
        case 'senal':
          template = generateSenalPDF(formData as SenalData);
          filename = `Contrato_Senal_${(formData as SenalData).vehiculo.matricula}.pdf`;
          break;
        case 'factura':
          template = generateFacturaPDF(formData as FacturaData);
          filename = `Factura_${(formData as FacturaData).numeroFactura}.pdf`;
          break;
        case 'proforma':
          template = generateProformaPDF(formData as ProformaData);
          filename = `Proforma_${(formData as ProformaData).numeroProforma}.pdf`;
          break;
      }

      template.download(filename);
      onDownload();
    } catch (err) {
      console.error('Error descargando PDF:', err);
      setError('Error al descargar el documento');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-slate-900">Vista previa del documento</h3>
        <p className="text-sm text-slate-500 mt-1">
          {docTypeInfo?.name} - {docTypeInfo?.pages} página{docTypeInfo?.pages !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Preview */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {error ? (
            <div className="flex flex-col items-center justify-center h-[400px] bg-red-50">
              <span className="material-symbols-outlined text-4xl text-red-400 mb-2">error</span>
              <p className="text-red-600">{error}</p>
              <Button
                variant="outline"
                onClick={generatePreview}
                className="mt-4"
              >
                Reintentar
              </Button>
            </div>
          ) : previewUrl ? (
            <div className="relative bg-slate-100">
              <iframe
                src={previewUrl}
                className="w-full h-[400px] border-0"
                title="Vista previa del documento"
              />
              <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
                <p className="text-xs text-slate-500">
                  Desplázate para ver más páginas
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[400px] bg-slate-50">
              <span className="material-symbols-outlined text-4xl text-slate-300 animate-spin mb-2">
                progress_activity
              </span>
              <p className="text-slate-500">Generando vista previa...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Información del documento */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-500 uppercase">Tipo</p>
          <p className="font-medium text-slate-900">{docTypeInfo?.name}</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-500 uppercase">Vehículo</p>
          <p className="font-medium text-slate-900">{formData.vehiculo.matricula}</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-500 uppercase">Cliente</p>
          <p className="font-medium text-slate-900 truncate">
            {formData.comprador.isEmpresa
              ? formData.comprador.nombreEmpresa
              : `${formData.comprador.nombre} ${formData.comprador.apellidos}`}
          </p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-500 uppercase">Importe</p>
          <p className="font-medium text-[#135bec]">
            {'condiciones' in formData
              ? formData.condiciones.totalConIva.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
              : (formData as SenalData).precioTotal.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
          </p>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex gap-3 pt-4 border-t">
        <Button
          onClick={handleDownload}
          disabled={isGenerating || !previewUrl}
          className="flex-1 bg-[#135bec] hover:bg-[#0f4fd6]"
        >
          {isGenerating ? (
            <>
              <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
              Generando...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined mr-2">download</span>
              Descargar PDF
            </>
          )}
        </Button>

        {onSave && (
          <Button
            onClick={onSave}
            disabled={isSaving || !previewUrl}
            variant="outline"
            className="flex-1"
          >
            {isSaving ? (
              <>
                <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
                Guardando...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined mr-2">save</span>
                Guardar en sistema
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
