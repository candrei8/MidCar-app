"use client"

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Star, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { DragDropContext, Droppable, Draggable, OnDragEndResponder } from 'react-beautiful-dnd';

export interface UploadedFile extends File {
    preview: string;
    id: string;
    progress: number;
}

interface PhotoUploaderProps {
    onFilesChange: (files: UploadedFile[]) => void;
    onPrincipalChange: (fileId: string | null) => void;
}

export function PhotoUploader({ onFilesChange, onPrincipalChange }: PhotoUploaderProps) {
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [principal, setPrincipal] = useState<string | null>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const newFiles = acceptedFiles.map(file => Object.assign(file, {
            preview: URL.createObjectURL(file),
            id: `${file.name}-${file.lastModified}-${Math.random()}`,
            progress: 0,
        }));

        const combinedFiles = [...files, ...newFiles].slice(0, 20);
        setFiles(combinedFiles);
        onFilesChange(combinedFiles);

        // Set principal if it's the first image
        if (files.length === 0 && combinedFiles.length > 0) {
            const firstFileId = combinedFiles[0].id;
            setPrincipal(firstFileId);
            onPrincipalChange(firstFileId);
        }

        // Simulate upload progress
        combinedFiles.forEach(file => {
            if (file.progress === 0) {
                let progress = 0;
                const interval = setInterval(() => {
                    progress += 10;
                    if (progress >= 100) {
                        clearInterval(interval);
                        progress = 100;
                    }
                    setFiles(prevFiles => prevFiles.map(f => f.id === file.id ? { ...f, progress } : f));
                }, 100);
            }
        });

    }, [files, onFilesChange, onPrincipalChange]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
        maxSize: 5 * 1024 * 1024,
        maxFiles: 20,
    });

    const removeFile = (fileId: string) => {
        const newFiles = files.filter(file => file.id !== fileId);
        setFiles(newFiles);
        onFilesChange(newFiles);

        if (principal === fileId) {
            const newPrincipalId = newFiles.length > 0 ? newFiles[0].id : null;
            setPrincipal(newPrincipalId);
            onPrincipalChange(newPrincipalId);
        }
    };

    const handleSetPrincipal = (fileId: string) => {
        setPrincipal(fileId);
        onPrincipalChange(fileId);
    };

    const onDragEnd: OnDragEndResponder = (result) => {
        if (!result.destination) {
            return;
        }

        const items = Array.from(files);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        setFiles(items);
        onFilesChange(items);
    };
    
    useEffect(() => {
        // Make sure to revoke the data uris to avoid memory leaks
        return () => files.forEach(file => URL.revokeObjectURL(file.preview));
    }, [files]);


    return (
        <div className="space-y-4">
            <div
                {...getRootProps()}
                className={`border-2 border-dashed border-surface-400 rounded-lg p-12 text-center cursor-pointer transition-colors ${isDragActive ? 'bg-primary/10 border-primary' : 'hover:bg-surface-200'}`}
            >
                <input {...getInputProps()} />
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                    Arrastra las fotos aquí
                </h3>
                <p className="text-muted-foreground mb-4">
                    o haz clic para seleccionar (JPG, PNG, WEBP, max 5MB, hasta 20 fotos)
                </p>
                <Button variant="outline" type="button">
                    Seleccionar archivos
                </Button>
            </div>

            {files.length > 0 && (
                <div>
                    <h4 className="text-sm font-medium mb-2">Fotos subidas ({files.length}/20):</h4>
                    <DragDropContext onDragEnd={onDragEnd}>
                        <Droppable droppableId="photos-list" direction="horizontal">
                            {(provided) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4"
                                >
                                    {files.map((file, index) => (
                                        <Draggable key={file.id} draggableId={file.id} index={index}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    className={`relative group aspect-square ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                                                >
                                                    <div className="relative w-full h-full">
                                                        <img
                                                            src={file.preview}
                                                            alt={file.name}
                                                            className="w-full h-full object-cover rounded-lg"
                                                        />
                                                        {file.progress < 100 &&
                                                            <Progress value={file.progress} className="absolute bottom-0 left-0 right-0 h-1" />
                                                        }
                                                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                           <div {...provided.dragHandleProps} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-move text-white">
                                                                <GripVertical size={24} />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="absolute top-1 right-1 flex flex-col gap-1">
                                                        <Button
                                                            type="button"
                                                            variant="secondary"
                                                            size="icon"
                                                            className={`h-6 w-6 opacity-70 group-hover:opacity-100 transition-all ${principal === file.id ? 'bg-yellow-400 hover:bg-yellow-500 text-black' : ''}`}
                                                            onClick={() => handleSetPrincipal(file.id)}
                                                        >
                                                            <Star className={`h-4 w-4 ${principal === file.id ? 'fill-current' : ''}`} />
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            size="icon"
                                                            className="h-6 w-6 opacity-70 group-hover:opacity-100 transition-opacity"
                                                            onClick={() => removeFile(file.id)}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                </div>
            )}
        </div>
    );
}

