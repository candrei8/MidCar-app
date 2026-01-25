'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  DocumentType,
  CustomerData,
  VehicleDocumentData,
  CompraventaData,
  SenalData,
  FacturaData,
  ProformaData
} from '@/lib/documents/document-types';
import { getEmpresasActivas } from '@/lib/empresas';
import { saveDocument, getNextDocumentNumber } from '@/lib/documents/document-service';
import type { EmpresaVendedora } from '@/types';
import { DocumentTypeSelector } from './DocumentTypeSelector';
import { CustomerSelector } from './CustomerSelector';
import { CompraventaForm } from './forms/CompraventaForm';
import { SenalForm } from './forms/SenalForm';
import { FacturaForm } from './forms/FacturaForm';
import { ProformaForm } from './forms/ProformaForm';
import { DocumentPreview } from './preview/DocumentPreview';
import { cn } from '@/lib/utils';

interface ContactInput {
  id: string;
  nombre?: string;
  apellidos?: string;
  email?: string;
  telefono?: string;
  dni_cif?: string;
  direccion?: string;
  codigo_postal?: string;
  municipio?: string;
  provincia?: string;
}

interface VehicleInput {
  id: string;
  marca: string;
  modelo: string;
  version?: string;
  matricula: string;
  vin: string;
  año_matriculacion?: number;
  kilometraje?: number;
  combustible?: string;
  color_exterior?: string;
  potencia_cv?: number;
  cilindrada?: number;
  num_plazas?: number;
  num_puertas?: number;
  fecha_itv_vencimiento?: string;
  precio_venta?: number;
}

interface DocumentGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: VehicleInput;
  contacts: ContactInput[];
  onDocumentGenerated?: (documentType: DocumentType, data: unknown) => void;
}

const STEPS = [
  { id: 1, name: 'Tipo', description: 'Seleccionar documento' },
  { id: 2, name: 'Empresa', description: 'Empresa vendedora' },
  { id: 3, name: 'Cliente', description: 'Datos del cliente' },
  { id: 4, name: 'Datos', description: 'Completar información' },
  { id: 5, name: 'Generar', description: 'Vista previa y descarga' }
];

export function DocumentGeneratorModal({
  isOpen,
  onClose,
  vehicle,
  contacts,
  onDocumentGenerated
}: DocumentGeneratorModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [documentType, setDocumentType] = useState<DocumentType | null>(null);
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Empresas
  const [empresas, setEmpresas] = useState<EmpresaVendedora[]>([]);
  const [selectedEmpresa, setSelectedEmpresa] = useState<EmpresaVendedora | null>(null);
  const [loadingEmpresas, setLoadingEmpresas] = useState(false);

  // Convertir vehículo al formato del documento
  const vehicleDocData: VehicleDocumentData = {
    id: vehicle.id,
    marca: vehicle.marca,
    modelo: vehicle.modelo,
    version: vehicle.version,
    matricula: vehicle.matricula,
    bastidor: vehicle.vin,
    fechaMatriculacion: vehicle.año_matriculacion ? String(vehicle.año_matriculacion) : '',
    kilometros: vehicle.kilometraje || 0,
    combustible: vehicle.combustible || '',
    color: vehicle.color_exterior,
    potencia: vehicle.potencia_cv,
    cilindrada: vehicle.cilindrada,
    plazas: vehicle.num_plazas,
    puertas: vehicle.num_puertas,
    fechaITV: vehicle.fecha_itv_vencimiento
  };

  // Cargar empresas al abrir
  useEffect(() => {
    if (isOpen) {
      loadEmpresas();
    }
  }, [isOpen]);

  // Reset al cerrar
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      setDocumentType(null);
      setCustomer(null);
      setIsNewCustomer(false);
      setFormData({});
      setSelectedEmpresa(null);
      setSaveSuccess(false);
      setSaveError(null);
    }
  }, [isOpen]);

  const loadEmpresas = async () => {
    setLoadingEmpresas(true);
    try {
      const data = await getEmpresasActivas();
      setEmpresas(data);
      // Seleccionar la primera por defecto
      if (data.length > 0 && !selectedEmpresa) {
        setSelectedEmpresa(data[0]);
      }
    } catch (err) {
      console.error('Error cargando empresas:', err);
    } finally {
      setLoadingEmpresas(false);
    }
  };

  // Validar si se puede avanzar al siguiente paso
  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1:
        return documentType !== null;
      case 2:
        return selectedEmpresa !== null;
      case 3:
        // Permitir avanzar aunque no haya todos los datos del cliente
        // Los campos se pueden dejar vacíos y rellenar en el documento
        return customer !== null;
      case 4:
        // Siempre permitir avanzar - los valores por defecto ya están establecidos
        return true;
      default:
        return true;
    }
  };

  const validateFormData = (): boolean => {
    // Siempre permitir continuar - los valores por defecto se aplicarán
    // Los campos no son obligatorios para la generación
    return true;
  };

  const handleNext = () => {
    if (currentStep < 5 && canProceed()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCustomerSelect = (selectedCustomer: CustomerData, isNew: boolean) => {
    setCustomer(selectedCustomer);
    setIsNewCustomer(isNew);
  };

  const handleFormChange = (data: Record<string, unknown>) => {
    setFormData(data);
  };

  // Construir datos de vendedor desde la empresa seleccionada
  const buildVendedorData = (): CustomerData => {
    if (!selectedEmpresa) {
      return {
        nombre: 'Empresa no seleccionada',
        apellidos: '',
        dni: '',
        direccion: '',
        codigoPostal: '',
        localidad: '',
        provincia: '',
        telefono: '',
        email: '',
        isEmpresa: true
      };
    }

    return {
      nombre: selectedEmpresa.nombre_comercial,
      apellidos: '',
      dni: selectedEmpresa.cif,
      direccion: selectedEmpresa.direccion,
      codigoPostal: selectedEmpresa.codigo_postal,
      localidad: selectedEmpresa.localidad,
      provincia: selectedEmpresa.provincia,
      telefono: selectedEmpresa.telefono,
      email: selectedEmpresa.email,
      isEmpresa: true,
      nombreEmpresa: selectedEmpresa.razon_social || selectedEmpresa.nombre_comercial,
      cifEmpresa: selectedEmpresa.cif
    };
  };

  const buildCompleteFormData = (): CompraventaData | SenalData | FacturaData | ProformaData => {
    const vendedor = buildVendedorData();

    const base = {
      empresaId: selectedEmpresa?.id,
      vehiculo: vehicleDocData,
      vendedor,
      comprador: customer!,
      ...formData
    };

    return base as CompraventaData | SenalData | FacturaData | ProformaData;
  };

  const handleDownload = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      if (onDocumentGenerated && documentType) {
        onDocumentGenerated(documentType, buildCompleteFormData());
      }
    }, 500);
  };

  const handleSave = async () => {
    if (!documentType) return;

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const data = buildCompleteFormData();
      const result = await saveDocument(documentType, data);

      if (result.error) {
        setSaveError(result.error.message);
      } else {
        setSaveSuccess(true);
        // Notificar a otras partes de la app que se ha guardado un documento
        const eventTypeMap: Record<DocumentType, string> = {
          'compraventa': 'contracts',
          'senal': 'contracts',
          'factura': 'invoices',
          'proforma': 'invoices'
        };
        window.dispatchEvent(new CustomEvent('midcar-data-updated', {
          detail: { type: eventTypeMap[documentType] }
        }));
        if (onDocumentGenerated) {
          onDocumentGenerated(documentType, data);
        }
      }
    } catch (err) {
      setSaveError('Error al guardar el documento');
      console.error('Error guardando documento:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <DocumentTypeSelector
            selectedType={documentType}
            onSelect={setDocumentType}
          />
        );
      case 2:
        return renderEmpresaSelector();
      case 3:
        return (
          <CustomerSelector
            selectedCustomer={customer}
            onSelect={handleCustomerSelect}
            contacts={contacts}
            loadingContacts={false}
          />
        );
      case 4:
        if (!documentType || !customer) return null;
        return renderForm();
      case 5:
        if (!documentType || !customer) return null;
        return (
          <div className="space-y-4">
            <DocumentPreview
              documentType={documentType}
              formData={buildCompleteFormData()}
              onDownload={handleDownload}
              onSave={handleSave}
              isGenerating={isGenerating}
              isSaving={isSaving}
            />
            {saveSuccess && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                <span className="material-symbols-outlined text-green-600">check_circle</span>
                <p className="text-green-800 font-medium">Documento guardado correctamente</p>
              </div>
            )}
            {saveError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                <span className="material-symbols-outlined text-red-600">error</span>
                <p className="text-red-800">{saveError}</p>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const renderEmpresaSelector = () => {
    if (loadingEmpresas) {
      return (
        <div className="flex items-center justify-center py-12">
          <span className="material-symbols-outlined animate-spin text-4xl text-slate-400">progress_activity</span>
        </div>
      );
    }

    if (empresas.length === 0) {
      return (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">business</span>
          <p className="text-slate-500 mb-4">No hay empresas configuradas</p>
          <Button
            variant="outline"
            onClick={() => window.open('/configuracion', '_blank')}
          >
            Ir a Configuración
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div>
          <Label className="text-base font-semibold">Selecciona la empresa vendedora</Label>
          <p className="text-sm text-slate-500 mt-1">
            Esta empresa aparecerá como vendedor en el documento
          </p>
        </div>

        <div className="grid gap-3">
          {empresas.map((empresa) => (
            <button
              key={empresa.id}
              type="button"
              onClick={() => setSelectedEmpresa(empresa)}
              className={cn(
                'w-full p-4 rounded-xl border-2 text-left transition-all',
                selectedEmpresa?.id === empresa.id
                  ? 'border-[#135bec] bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              )}
            >
              <div className="flex items-center gap-4">
                {empresa.logo ? (
                  <img
                    src={empresa.logo}
                    alt={empresa.nombre_comercial}
                    className="h-12 w-12 object-contain rounded-lg bg-white border"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-[#135bec] to-blue-600 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {empresa.nombre_comercial.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900">{empresa.nombre_comercial}</h3>
                    {selectedEmpresa?.id === empresa.id && (
                      <span className="material-symbols-outlined text-[#135bec]">check_circle</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">{empresa.cif}</p>
                  <p className="text-xs text-slate-400 truncate">
                    {empresa.direccion}, {empresa.localidad}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderForm = () => {
    const suggestedPrice = vehicle.precio_venta || 0;

    switch (documentType) {
      case 'compraventa':
        return (
          <CompraventaForm
            vehicle={vehicleDocData}
            customer={customer!}
            formData={formData as Partial<CompraventaData>}
            onChange={handleFormChange}
            suggestedPrice={suggestedPrice}
          />
        );
      case 'senal':
        return (
          <SenalForm
            vehicle={vehicleDocData}
            customer={customer!}
            formData={formData as Partial<SenalData>}
            onChange={handleFormChange}
            suggestedPrice={suggestedPrice}
          />
        );
      case 'factura':
        return (
          <FacturaForm
            vehicle={vehicleDocData}
            customer={customer!}
            formData={formData as Partial<FacturaData>}
            onChange={handleFormChange}
            suggestedPrice={suggestedPrice}
          />
        );
      case 'proforma':
        return (
          <ProformaForm
            vehicle={vehicleDocData}
            customer={customer!}
            formData={formData as Partial<ProformaData>}
            onChange={handleFormChange}
            suggestedPrice={suggestedPrice}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#135bec]">description</span>
            Generar Documento
          </DialogTitle>
          <DialogDescription>
            {vehicle.marca} {vehicle.modelo} - {vehicle.matricula}
          </DialogDescription>
        </DialogHeader>

        {/* Stepper */}
        <div className="py-4 border-b">
          <nav aria-label="Progress">
            <ol className="flex items-center justify-between">
              {STEPS.map((step, index) => (
                <li key={step.id} className="flex items-center">
                  <div
                    className={cn(
                      'flex items-center',
                      index !== STEPS.length - 1 && 'flex-1'
                    )}
                  >
                    <div
                      className={cn(
                        'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors',
                        currentStep > step.id
                          ? 'bg-emerald-500 text-white'
                          : currentStep === step.id
                          ? 'bg-[#135bec] text-white'
                          : 'bg-slate-100 text-slate-400'
                      )}
                    >
                      {currentStep > step.id ? (
                        <span className="material-symbols-outlined text-sm">check</span>
                      ) : (
                        step.id
                      )}
                    </div>
                    <div className="ml-2 hidden sm:block">
                      <p className={cn(
                        'text-sm font-medium',
                        currentStep >= step.id ? 'text-slate-900' : 'text-slate-400'
                      )}>
                        {step.name}
                      </p>
                    </div>
                  </div>
                  {index !== STEPS.length - 1 && (
                    <div
                      className={cn(
                        'hidden sm:block w-8 h-0.5 mx-2',
                        currentStep > step.id ? 'bg-emerald-500' : 'bg-slate-200'
                      )}
                    />
                  )}
                </li>
              ))}
            </ol>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4 min-h-0">
          {renderStepContent()}
        </div>

        {/* Footer */}
        <DialogFooter className="border-t pt-4">
          <div className="flex justify-between w-full">
            <Button
              variant="outline"
              onClick={currentStep === 1 ? onClose : handleBack}
            >
              {currentStep === 1 ? 'Cancelar' : 'Atrás'}
            </Button>
            {currentStep < 5 && (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="bg-[#135bec] hover:bg-[#0f4fd6]"
              >
                Continuar
                <span className="material-symbols-outlined ml-1 text-sm">arrow_forward</span>
              </Button>
            )}
            {currentStep === 5 && (
              <Button
                onClick={onClose}
                variant="outline"
              >
                Cerrar
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
