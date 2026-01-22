'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { CustomerData } from '@/lib/documents/document-types';
import { PROVINCIAS_ESPANA } from '@/lib/documents/constants';
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

interface CustomerSelectorProps {
  selectedCustomer: CustomerData | null;
  onSelect: (customer: CustomerData, isNew: boolean) => void;
  contacts: ContactInput[];
  loadingContacts?: boolean;
}

const emptyCustomer: CustomerData = {
  nombre: '',
  apellidos: '',
  dni: '',
  direccion: '',
  codigoPostal: '',
  localidad: '',
  provincia: '',
  telefono: '',
  email: '',
  isEmpresa: false,
  nombreEmpresa: '',
  cifEmpresa: ''
};

export function CustomerSelector({
  selectedCustomer,
  onSelect,
  contacts,
  loadingContacts = false
}: CustomerSelectorProps) {
  const [activeTab, setActiveTab] = useState<'existing' | 'manual'>('existing');
  const [searchTerm, setSearchTerm] = useState('');
  const [manualCustomer, setManualCustomer] = useState<CustomerData>(selectedCustomer || emptyCustomer);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);

  // Filtrar contactos por búsqueda
  const filteredContacts = contacts.filter(contact => {
    const fullName = `${contact.nombre || ''} ${contact.apellidos || ''}`.toLowerCase();
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) ||
           contact.email?.toLowerCase().includes(search) ||
           contact.dni_cif?.toLowerCase().includes(search);
  });

  // Manejar selección de contacto existente
  const handleContactSelect = (contact: ContactInput) => {
    setSelectedContactId(contact.id);
    const customerData: CustomerData = {
      id: contact.id,
      nombre: contact.nombre || '',
      apellidos: contact.apellidos || '',
      dni: contact.dni_cif || '',
      direccion: contact.direccion || '',
      codigoPostal: contact.codigo_postal || '',
      localidad: contact.municipio || '',
      provincia: contact.provincia || '',
      telefono: contact.telefono || '',
      email: contact.email || '',
      isEmpresa: false,
      nombreEmpresa: '',
      cifEmpresa: ''
    };
    onSelect(customerData, false);
  };

  // Manejar cambios en el formulario manual
  const handleManualChange = (field: keyof CustomerData, value: string | boolean) => {
    const updated = { ...manualCustomer, [field]: value };
    setManualCustomer(updated);

    // Solo enviar si hay datos mínimos
    if (updated.nombre && updated.dni) {
      onSelect(updated, true);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-slate-900">Datos del cliente</h3>
        <p className="text-sm text-slate-500 mt-1">Selecciona un cliente existente o introduce los datos manualmente</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'existing' | 'manual')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="existing">
            <span className="material-symbols-outlined text-sm mr-2">contacts</span>
            Contacto existente
          </TabsTrigger>
          <TabsTrigger value="manual">
            <span className="material-symbols-outlined text-sm mr-2">edit</span>
            Introducir manualmente
          </TabsTrigger>
        </TabsList>

        <TabsContent value="existing" className="mt-4">
          {/* Buscador */}
          <div className="relative mb-4">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              search
            </span>
            <Input
              placeholder="Buscar por nombre, email, DNI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Lista de contactos */}
          <div className="max-h-[300px] overflow-y-auto space-y-2">
            {loadingContacts ? (
              <div className="flex items-center justify-center py-8">
                <span className="material-symbols-outlined animate-spin text-slate-400">progress_activity</span>
                <span className="ml-2 text-slate-500">Cargando contactos...</span>
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <span className="material-symbols-outlined text-4xl mb-2 block">person_off</span>
                <p>No se encontraron contactos</p>
                <p className="text-sm mt-1">Prueba con otro término de búsqueda o introduce los datos manualmente</p>
              </div>
            ) : (
              filteredContacts.map((contact) => (
                <Card
                  key={contact.id}
                  className={cn(
                    'cursor-pointer transition-all duration-200',
                    selectedContactId === contact.id
                      ? 'ring-2 ring-[#135bec] border-[#135bec] bg-blue-50/50'
                      : 'hover:border-slate-300'
                  )}
                  onClick={() => handleContactSelect(contact)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center',
                        selectedContactId === contact.id
                          ? 'bg-[#135bec] text-white'
                          : 'bg-slate-100 text-slate-600'
                      )}>
                        <span className="material-symbols-outlined">person</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate">
                          {`${contact.nombre || ''} ${contact.apellidos || ''}`.trim() || 'Sin nombre'}
                        </p>
                        <p className="text-sm text-slate-500 truncate">
                          {contact.dni_cif || ''} {contact.dni_cif && (contact.telefono || contact.email) ? '•' : ''} {contact.telefono || contact.email || 'Sin contacto'}
                        </p>
                      </div>
                      {selectedContactId === contact.id && (
                        <span className="material-symbols-outlined text-[#135bec]">check_circle</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="manual" className="mt-4">
          <div className="space-y-4">
            {/* Es empresa */}
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
              <Checkbox
                id="isEmpresa"
                checked={manualCustomer.isEmpresa}
                onCheckedChange={(checked) => handleManualChange('isEmpresa', !!checked)}
              />
              <Label htmlFor="isEmpresa" className="cursor-pointer">
                El cliente es una empresa
              </Label>
            </div>

            {/* Datos de empresa */}
            {manualCustomer.isEmpresa && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                <div className="col-span-2 md:col-span-1">
                  <Label htmlFor="nombreEmpresa">Nombre de la empresa *</Label>
                  <Input
                    id="nombreEmpresa"
                    value={manualCustomer.nombreEmpresa}
                    onChange={(e) => handleManualChange('nombreEmpresa', e.target.value)}
                    placeholder="Empresa S.L."
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <Label htmlFor="cifEmpresa">CIF *</Label>
                  <Input
                    id="cifEmpresa"
                    value={manualCustomer.cifEmpresa}
                    onChange={(e) => handleManualChange('cifEmpresa', e.target.value)}
                    placeholder="B12345678"
                  />
                </div>
              </div>
            )}

            {/* Datos personales */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nombre">{manualCustomer.isEmpresa ? 'Nombre del representante *' : 'Nombre *'}</Label>
                <Input
                  id="nombre"
                  value={manualCustomer.nombre}
                  onChange={(e) => handleManualChange('nombre', e.target.value)}
                  placeholder="Juan"
                />
              </div>
              <div>
                <Label htmlFor="apellidos">Apellidos *</Label>
                <Input
                  id="apellidos"
                  value={manualCustomer.apellidos}
                  onChange={(e) => handleManualChange('apellidos', e.target.value)}
                  placeholder="García López"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dni">DNI/NIE *</Label>
                <Input
                  id="dni"
                  value={manualCustomer.dni}
                  onChange={(e) => handleManualChange('dni', e.target.value)}
                  placeholder="12345678A"
                />
              </div>
              <div>
                <Label htmlFor="telefono">Teléfono *</Label>
                <Input
                  id="telefono"
                  value={manualCustomer.telefono}
                  onChange={(e) => handleManualChange('telefono', e.target.value)}
                  placeholder="612 345 678"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={manualCustomer.email}
                onChange={(e) => handleManualChange('email', e.target.value)}
                placeholder="cliente@email.com"
              />
            </div>

            <div>
              <Label htmlFor="direccion">Dirección *</Label>
              <Input
                id="direccion"
                value={manualCustomer.direccion}
                onChange={(e) => handleManualChange('direccion', e.target.value)}
                placeholder="Calle Principal, 123"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="codigoPostal">C.P. *</Label>
                <Input
                  id="codigoPostal"
                  value={manualCustomer.codigoPostal}
                  onChange={(e) => handleManualChange('codigoPostal', e.target.value)}
                  placeholder="28001"
                />
              </div>
              <div>
                <Label htmlFor="localidad">Localidad *</Label>
                <Input
                  id="localidad"
                  value={manualCustomer.localidad}
                  onChange={(e) => handleManualChange('localidad', e.target.value)}
                  placeholder="Madrid"
                />
              </div>
              <div>
                <Label htmlFor="provincia">Provincia *</Label>
                <select
                  id="provincia"
                  value={manualCustomer.provincia}
                  onChange={(e) => handleManualChange('provincia', e.target.value)}
                  className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#135bec]"
                >
                  <option value="">Seleccionar...</option>
                  {PROVINCIAS_ESPANA.map((prov) => (
                    <option key={prov} value={prov}>{prov}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
