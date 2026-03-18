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
    isExisting?: boolean; // true for photos already uploaded to storage
}

interface PhotoUploaderProps {
    onFilesChange: (files: UploadedFile[]) => void;
    onPrincipalChange: (fileId: string | null) => void;
    initialFiles?: UploadedFile[];
    initialPrincipal?: string | null;
}

const MAX_PHOTOS = 20;

export function PhotoUploader({ onFilesChange, onPrincipalChange, initialFiles, initialPrincipal }: PhotoUploaderProps) {
    const [files, setFiles] = useState<UploadedFile[]>(initialFiles || []);
    const [principal, setPrincipal] = useState<string | null>(initialPrincipal || null);
    const urlsRef = useRef<string[]>([]);
    const intervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
    const initializedRef = useRef(false);

    // Load initial files when they become available (edit mode)
    useEffect(() => {
        if (initialFiles && initialFiles.length > 0 && !initializedRef.current) {
            initializedRef.current = true;
            setFiles(initialFiles);
            const principalId = initialPrincipal || initialFiles[0]?.id || null;
            setPrincipal(principalId);
            queueMicrotask(() => {
                onFilesChange(initialFiles);
                onPrincipalChange(principalId);
            });
        }
    }, [initialFiles, initialPrincipal, onFilesChange, onPrincipalChange]);

    // Cleanup all intervals on unmount
    useEffect(() => {
        return () => {
            intervalsRef.current.forEach(interval => clearInterval(interval));
            intervalsRef.current.clear();
        };
    }, []);

    // Cleanup URLs on unmount
    useEffect(() => {
        return () => {
            urlsRef.current.forEach(url => URL.revokeObjectURL(url));
        };
    }, []);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return;

        setFiles(prev => {
            const spotsLeft = MAX_PHOTOS - prev.length;
            if (spotsLeft <= 0) return prev;

            // Only take as many files as we have room for
            const filesToAdd = acceptedFiles.slice(0, spotsLeft);

            const newFiles: UploadedFile[] = filesToAdd.map(file => {
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

            const combinedFiles = [...prev, ...newFiles];
            const isFirstUpload = prev.length === 0 && combinedFiles.length > 0;
            const firstFileId = combinedFiles[0]?.id || null;

            // Notify parent
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
                        intervalsRef.current.delete(newFile.id);
                        progress = 100;
                    }
                    setFiles(currentFiles =>
                        currentFiles.map(f =>
                            f.id === newFile.id ? { ...f, progress } : f
                        )
                    );
                }, 100);
                intervalsRef.current.set(newFile.id, interval);
            });

            return combinedFiles;
        });
    }, [onFilesChange, onPrincipalChange]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
        maxSize: 5 * 1024 * 1024,
        // No maxFiles limit - we handle it ourselves in onDrop
    });

    const removeFile = useCallback((fileId: string) => {
        // 1. Clear any running progress interval for this file
        const interval = intervalsRef.current.get(fileId);
        if (interval) {
            clearInterval(interval);
            intervalsRef.current.delete(fileId);
        }

        // 2. Update state and collect info for side effects
        setFiles(prev => {
            const fileToRemove = prev.find(f => f.id === fileId);
            if (!fileToRemove) return prev;

            const newFiles = prev.filter(f => f.id !== fileId);

            // Revoke URL after state update (outside setState would be ideal,
            // but we need the file reference). Safe because we're removing it from render.
            if (!fileToRemove.isExisting) {
                // Defer URL revocation to after React has committed the render
                setTimeout(() => {
                    URL.revokeObjectURL(fileToRemove.preview);
                    urlsRef.current = urlsRef.current.filter(url => url !== fileToRemove.preview);
                }, 0);
            }

            // Update principal if needed
            const needsNewPrincipal = principal === fileId;
            const newPrincipalId = newFiles.length > 0 ? newFiles[0].id : null;

            queueMicrotask(() => {
                if (needsNewPrincipal) {
                    setPrincipal(newPrincipalId);
                    onPrincipalChange(newPrincipalId);
                }
                onFilesChange(newFiles);
            });

            return newFiles;
        });
    }, [principal, onFilesChange, onPrincipalChange]);

    const handleSetPrincipal = useCallback((fileId: string) => {
        setPrincipal(fileId);
        onPrincipalChange(fileId);
    }, [onPrincipalChange]);

    const onDragEnd: OnDragEndResponder = (result) => {
        if (!result.destination) {
            return;
        }

        setFiles(prev => {
            const items = Array.from(prev);
            const [reorderedItem] = items.splice(result.source.index, 1);
            items.splice(result.destination!.index, 0, reorderedItem);
            queueMicrotask(() => onFilesChange(items));
            return items;
        });
    };

    const remainingSlots = MAX_PHOTOS - files.length;

    return (
        <div className="space-y-4">
            <div
                {...getRootProps()}
                className={`border-2 border-dashed border-surface-400 rounded-lg p-12 text-center cursor-pointer transition-colors ${isDragActive ? 'bg-primary/10 border-primary' : 'hover:bg-surface-200'} ${remainingSlots <= 0 ? 'opacity-50 pointer-events-none' : ''}`}
            >
                <input {...getInputProps()} />
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                    Arrastra las fotos aquí
                </h3>
                <p className="text-muted-foreground mb-4">
                    o haz clic para seleccionar (JPG, PNG, WEBP, max 5MB)
                </p>
                {remainingSlots > 0 ? (
                    <p className="text-xs text-muted-foreground mb-4">
                        Puedes añadir hasta {remainingSlots} foto{remainingSlots !== 1 ? 's' : ''} más
                    </p>
                ) : (
                    <p className="text-xs text-amber-600 font-medium mb-4">
                        Has alcanzado el límite de {MAX_PHOTOS} fotos
                    </p>
                )}
                <Button variant="outline" type="button" disabled={remainingSlots <= 0}>
                    Seleccionar archivos
                </Button>
            </div>

            {files.length > 0 && (
                <div>
                    <h4 className="text-sm font-medium mb-2">Fotos subidas ({files.length}/{MAX_PHOTOS}):</h4>
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
                                                                e.currentTarget.src = '/placeholder-proximamente.svg';
                                                            }}
                                                        />
                                                        {fileData.progress < 100 && (
                                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                                <div className="w-3/4">
                                                                    <Progress value={fileData.progress} className="h-2" />
                                                                </div>
                                                            </div>
                                                        )}
                                                        {/* Drag handle - only visible on hover, behind action buttons */}
                                                        <div
                                                            {...provided.dragHandleProps}
                                                            className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-auto cursor-move"
                                                        >
                                                            <GripVertical size={24} className="text-white" />
                                                        </div>
                                                    </div>

                                                    {/* Action buttons - z-index above the drag handle */}
                                                    <div className="absolute top-1 right-1 flex flex-col gap-1 z-10">
                                                        <button
                                                            type="button"
                                                            className={`h-7 w-7 rounded-md flex items-center justify-center transition-all shadow-sm ${principal === fileData.id ? 'bg-yellow-400 hover:bg-yellow-500 text-black' : 'bg-white/80 hover:bg-white text-gray-600'}`}
                                                            onClick={(e) => { e.stopPropagation(); handleSetPrincipal(fileData.id); }}
                                                        >
                                                            <Star className={`h-4 w-4 ${principal === fileData.id ? 'fill-current' : ''}`} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="h-7 w-7 rounded-md flex items-center justify-center bg-red-500 hover:bg-red-600 text-white transition-all shadow-sm"
                                                            onClick={(e) => { e.stopPropagation(); removeFile(fileData.id); }}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </button>
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
