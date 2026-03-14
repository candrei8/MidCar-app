'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DocumentType, DocumentTypeInfo } from '@/lib/documents/document-types';
import { DOCUMENT_TYPES } from '@/lib/documents/constants';
import { cn } from '@/lib/utils';

interface DocumentTypeSelectorProps {
  selectedType: DocumentType | null;
  onSelect: (type: DocumentType) => void;
}

const ICONS: Record<string, React.ReactNode> = {
  FileText: (
    <span className="material-symbols-outlined text-3xl">description</span>
  ),
  FileSignature: (
    <span className="material-symbols-outlined text-3xl">edit_document</span>
  ),
  Receipt: (
    <span className="material-symbols-outlined text-3xl">receipt_long</span>
  ),
  FileSpreadsheet: (
    <span className="material-symbols-outlined text-3xl">request_quote</span>
  )
};

export function DocumentTypeSelector({ selectedType, onSelect }: DocumentTypeSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-slate-900">Selecciona el tipo de documento</h3>
        <p className="text-sm text-slate-500 mt-1">Elige el documento que deseas generar para este vehículo</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DOCUMENT_TYPES.map((docType: DocumentTypeInfo) => (
          <Card
            key={docType.id}
            className={cn(
              'cursor-pointer transition-all duration-200 hover:shadow-md',
              selectedType === docType.id
                ? 'ring-2 ring-[#135bec] border-[#135bec] bg-blue-50/50'
                : 'hover:border-slate-300'
            )}
            onClick={() => onSelect(docType.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className={cn(
                  'flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center',
                  selectedType === docType.id
                    ? 'bg-[#135bec] text-white'
                    : 'bg-slate-100 text-slate-600'
                )}>
                  {ICONS[docType.icon]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-slate-900">{docType.name}</h4>
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full',
                      selectedType === docType.id
                        ? 'bg-[#135bec] text-white'
                        : 'bg-slate-100 text-slate-600'
                    )}>
                      {docType.pages} pág.
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                    {docType.description}
                  </p>
                </div>
                {selectedType === docType.id && (
                  <div className="flex-shrink-0">
                    <span className="material-symbols-outlined text-[#135bec]">check_circle</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
