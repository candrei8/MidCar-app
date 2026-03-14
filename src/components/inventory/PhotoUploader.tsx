"use client"

import { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Star, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { DragDropContext, Droppable, Draggable, OnDragEndResponder, DroppableProps } from 'react-beautiful-dnd';

// StrictModeDroppable wrapper to fix react-beautiful-dnd + React 18 compatibility
function StrictModeDroppable({ children, ...props }: DroppableProps) {
    const [enabled, setEnabled] = useState(false);

    useEffect(() => {
        const animation = requestAnimationFrame(() => setEnabled(true));
        return () => {
            cancelAnimationFrame(animation);
            setEnabled(false);
        };
    }, []);

    if (!enabled) {
        return null;
    }

    return <Droppable {...props}>{children}</Droppable>;
}

// Separate interface - don't extend File
export interface UploadedFile {
    file: File;
    preview: string;
    id: string;
    progress: number;
    name: string;
}

interface PhotoUploaderProps {
    onFilesChange: (files: UploadedFile[]) => void;
    onPrincipalChange: (fileId: string | null) => void;
}

export function PhotoUploader({ onFilesChange, onPrincipalChange }: PhotoUploaderProps) {
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [principal, setPrincipal] = useState<string | null>(null);
    const urlsRef = useRef<string[]>([]);
    const intervalsRef = useRef<NodeJS.Timeout[]>([]);

    // Cleanup intervals on unmount
    useEffect(() => {
        return () => {
            intervalsRef.current.forEach(clearInterval);
        };
    }, []);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const newFiles: UploadedFile[] = acceptedFiles.map(file => {
            const previewUrl = URL.createObjectURL(file);
            urlsRef.current.push(previewUrl);

            return {
                file: file,
                preview: previewUrl,
                id: `${file.name}-${file.lastModified}-${Math.random()}`,
                progress: 0,
                name: file.name,
            };
        });

        // Calculate combined files outside of setState
        setFiles(prev => {
            const combinedFiles = [...prev, ...newFiles].slice(0, 20);
            const isFirstUpload = prev.length === 0 && combinedFiles.length > 0;
            const firstFileId = combinedFiles[0]?.id || null;

            // Schedule all parent updates for next tick to avoid setState during render
            queueMicrotask(() => {
                if (isFirstUpload && firstFileId) {
                    setPrincipal(firstFileId);
                    onPrincipalChange(firstFileId);
                }
                onFilesChange(combinedFiles);
            });

            // Simulate upload progress for new files
            newFiles.forEach(newFile => {
                let progress = 0;
                const interval = setInterval(() => {
                    progress += 10;
                    if (progress >= 100) {
                        clearInterval(interval);
                        intervalsRef.current = intervalsRef.current.filter(i => i !== interval);
                        progress = 100;
                    }
                    setFiles(currentFiles =>
                        currentFiles.map(f =>
                            f.id === newFile.id ? { ...f, progress } : f
                        )
                    );
                }, 100);
                intervalsRef.current.push(interval);
            });

            return combinedFiles;
        });
    }, [onFilesChange, onPrincipalChange]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
        maxSize: 5 * 1024 * 1024,
        maxFiles: 20,
    });

    const removeFile = (fileId: string) => {
        setFiles(prev => {
            const fileToRemove = prev.find(f => f.id === fileId);
            const newFiles = prev.filter(f => f.id !== fileId);
            const needsNewPrincipal = principal === fileId;
            const newPrincipalId = newFiles.length > 0 ? newFiles[0].id : null;

            // Revoke URL of removed file
            if (fileToRemove) {
                URL.revokeObjectURL(fileToRemove.preview);
                urlsRef.current = urlsRef.current.filter(url => url !== fileToRemove.preview);
            }

            // Schedule parent updates for next tick
            queueMicrotask(() => {
                if (needsNewPrincipal) {
                    setPrincipal(newPrincipalId);
                    onPrincipalChange(newPrincipalId);
                }
                onFilesChange(newFiles);
            });

            return newFiles;
        });
    };

    const handleSetPrincipal = (fileId: string) => {
        setPrincipal(fileId);
        onPrincipalChange(fileId);
    };

    const onDragEnd: OnDragEndResponder = (result) => {
        if (!result.destination) {
            return;
        }

        setFiles(prev => {
            const items = Array.from(prev);
            const [reorderedItem] = items.splice(result.source.index, 1);
            items.splice(result.destination!.index, 0, reorderedItem);
            // Defer parent notification
            queueMicrotask(() => onFilesChange(items));
            return items;
        });
    };

    // Cleanup URLs only on unmount
    useEffect(() => {
        return () => {
            urlsRef.current.forEach(url => URL.revokeObjectURL(url));
        };
    }, []);

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
                        <StrictModeDroppable droppableId="photos-list" direction="horizontal">
                            {(provided) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4"
                                >
                                    {files.map((fileData, index) => (
                                        <Draggable key={fileData.id} draggableId={fileData.id} index={index}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    className={`relative group aspect-square ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                                                >
                                                    <div className="relative w-full h-full rounded-lg overflow-hidden bg-gray-100">
                                                        <img
                                                            src={fileData.preview}
                                                            alt={fileData.name}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                console.error('Image load error:', fileData.preview);
                                                                e.currentTarget.src = '/placeholder-car.svg';
                                                            }}
                                                        />
                                                        {fileData.progress < 100 && (
                                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                                <div className="w-3/4">
                                                                    <Progress value={fileData.progress} className="h-2" />
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <div {...provided.dragHandleProps} className="cursor-move text-white">
                                                                <GripVertical size={24} />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="absolute top-1 right-1 flex flex-col gap-1">
                                                        <Button
                                                            type="button"
                                                            variant="secondary"
                                                            size="icon"
                                                            className={`h-6 w-6 opacity-70 group-hover:opacity-100 transition-all ${principal === fileData.id ? 'bg-yellow-400 hover:bg-yellow-500 text-black' : ''}`}
                                                            onClick={() => handleSetPrincipal(fileData.id)}
                                                        >
                                                            <Star className={`h-4 w-4 ${principal === fileData.id ? 'fill-current' : ''}`} />
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            size="icon"
                                                            className="h-6 w-6 opacity-70 group-hover:opacity-100 transition-opacity"
                                                            onClick={() => removeFile(fileData.id)}
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
                        </StrictModeDroppable>
                    </DragDropContext>
                </div>
            )}
        </div>
    );
}
