"use client"

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileText, Upload, X, Check, Eye, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TIPOS_DOCUMENTO_VEHICULO } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export interface UploadedDocument extends File {
    id: string;
    docType: string;
    preview?: string;
}

interface DocumentUploaderProps {
    onDocumentsChange: (documents: UploadedDocument[]) => void;
}

export function DocumentUploader({ onDocumentsChange }: DocumentUploaderProps) {
    const [documents, setDocuments] = useState<UploadedDocument[]>([]);

    const onDrop = useCallback((acceptedFiles: File[], docType: string) => {
        const newDocs = acceptedFiles.map(file => Object.assign(file, {
            id: `${docType}-${Date.now()}`,
            docType: docType,
            preview: URL.createObjectURL(file)
        }));

        setDocuments(prev => {
            // Remove existing document of same type if any
            const filtered = prev.filter(d => d.docType !== docType);
            const updated = [...filtered, ...newDocs];
            onDocumentsChange(updated);
            return updated;
        });
    }, [onDocumentsChange]);

    const removeDocument = (docType: string) => {
        setDocuments(prev => {
            const updated = prev.filter(d => d.docType !== docType);
            onDocumentsChange(updated);
            return updated;
        });
    };

    const getDocument = (docType: string) => documents.find(d => d.docType === docType);

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground mb-4">Documentación del Vehículo</h3>
            <div className="grid gap-4">
                {TIPOS_DOCUMENTO_VEHICULO.map((type) => {
                    const doc = getDocument(type.value);
                    return (
                        <DocumentRow 
                            key={type.value} 
                            type={type} 
                            document={doc} 
                            onDrop={(files) => onDrop(files, type.value)}
                            onRemove={() => removeDocument(type.value)}
                        />
                    );
                })}
            </div>
            <div className="text-xs text-muted-foreground mt-4">
                * Documentos obligatorios. Máximo 10MB por archivo. Solo formato PDF.
            </div>
        </div>
    );
}

interface DocumentRowProps {
    type: typeof TIPOS_DOCUMENTO_VEHICULO[number];
    document?: UploadedDocument;
    onDrop: (files: File[]) => void;
    onRemove: () => void;
}

function DocumentRow({ type, document, onDrop, onRemove }: DocumentRowProps) {
    const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        maxSize: 10 * 1024 * 1024, // 10MB
        maxFiles: 1,
        noClick: true, // We trigger it manually
        noKeyboard: true
    });

    return (
        <div className={cn(
            "flex items-center justify-between p-4 rounded-lg border transition-colors",
            document ? "bg-surface-100 border-success/30" : "bg-card border-card-border",
            isDragActive && "border-primary bg-primary/5"
        )} {...getRootProps()}>
            <input {...getInputProps()} />
            
            <div className="flex items-center gap-4 flex-1">
                <div className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0",
                    document ? "bg-success/10 text-success" : "bg-surface-200 text-muted-foreground"
                )}>
                    {document ? <Check className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                </div>
                
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className={cn("font-medium truncate", document ? "text-foreground" : "text-muted-foreground")}>
                            {type.label}
                        </span>
                        {type.required && !document && (
                            <Badge variant="outline" className="text-xs border-destructive/50 text-destructive">
                                Requerido
                            </Badge>
                        )}
                    </div>
                    {document ? (
                        <p className="text-xs text-muted-foreground truncate">{document.name}</p>
                    ) : (
                        <p className="text-xs text-muted-foreground">Sin documento</p>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2">
                {document ? (
                    <>
                         <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={(e) => {
                                e.stopPropagation();
                                if(document.preview) window.open(document.preview, '_blank');
                            }}
                        >
                            <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={(e) => {
                                e.stopPropagation();
                                onRemove();
                            }}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </>
                ) : (
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={open}
                        className={cn("gap-2", isDragActive && "border-primary text-primary")}
                    >
                        <Upload className="h-3 w-3" />
                        Subir PDF
                    </Button>
                )}
            </div>
        </div>
    );
}