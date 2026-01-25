"use client"

import { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { PROVINCIAS, CIF_REGEX, EMAIL_REGEX } from "@/lib/constants"
import {
    getEmpresas,
    createEmpresa,
    updateEmpresa,
    deleteEmpresa,
    toggleEmpresaActiva,
    initDefaultEmpresas,
} from "@/lib/empresas"
import type { EmpresaVendedora } from "@/types"

// Estado inicial del formulario
const EMPTY_FORM: Omit<EmpresaVendedora, 'id' | 'created_at' | 'updated_at' | 'es_ejemplo'> = {
    nombre_comercial: '',
    razon_social: '',
    cif: '',
    direccion: '',
    codigo_postal: '',
    localidad: '',
    provincia: '',
    telefono: '',
    email: '',
    web: '',
    logo: '',
    activa: true,
}

export default function ConfiguracionPage() {
    const [empresas, setEmpresas] = useState<EmpresaVendedora[]>([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [editingEmpresa, setEditingEmpresa] = useState<EmpresaVendedora | null>(null)
    const [empresaToDelete, setEmpresaToDelete] = useState<EmpresaVendedora | null>(null)
    const [formData, setFormData] = useState(EMPTY_FORM)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [isSaving, setIsSaving] = useState(false)

    // Cargar empresas al montar
    useEffect(() => {
        const loadEmpresas = async () => {
            await initDefaultEmpresas()
            const data = await getEmpresas()
            setEmpresas(data)
        }
        loadEmpresas()
    }, [])

    // Actualizar campo del formulario
    const updateField = (field: string, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }))
        }
    }

    // Validar formulario
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {}

        if (!formData.nombre_comercial.trim()) {
            newErrors.nombre_comercial = 'El nombre comercial es obligatorio'
        }

        if (!formData.razon_social.trim()) {
            newErrors.razon_social = 'La razón social es obligatoria'
        }

        if (!formData.cif.trim()) {
            newErrors.cif = 'El CIF es obligatorio'
        } else if (!CIF_REGEX.test(formData.cif.toUpperCase())) {
            newErrors.cif = 'El formato del CIF no es válido'
        }

        if (!formData.direccion.trim()) {
            newErrors.direccion = 'La dirección es obligatoria'
        }

        if (!formData.codigo_postal.trim()) {
            newErrors.codigo_postal = 'El código postal es obligatorio'
        } else if (!/^[0-9]{5}$/.test(formData.codigo_postal)) {
            newErrors.codigo_postal = 'El código postal debe tener 5 dígitos'
        }

        if (!formData.localidad.trim()) {
            newErrors.localidad = 'La localidad es obligatoria'
        }

        if (!formData.provincia.trim()) {
            newErrors.provincia = 'La provincia es obligatoria'
        }

        if (formData.email && !EMAIL_REGEX.test(formData.email)) {
            newErrors.email = 'El formato del email no es válido'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    // Abrir modal para crear
    const handleOpenCreate = () => {
        setEditingEmpresa(null)
        setFormData(EMPTY_FORM)
        setErrors({})
        setIsModalOpen(true)
    }

    // Abrir modal para editar
    const handleOpenEdit = (empresa: EmpresaVendedora) => {
        setEditingEmpresa(empresa)
        setFormData({
            nombre_comercial: empresa.nombre_comercial,
            razon_social: empresa.razon_social,
            cif: empresa.cif,
            direccion: empresa.direccion,
            codigo_postal: empresa.codigo_postal,
            localidad: empresa.localidad,
            provincia: empresa.provincia,
            telefono: empresa.telefono,
            email: empresa.email,
            web: empresa.web || '',
            logo: empresa.logo || '',
            activa: empresa.activa,
        })
        setErrors({})
        setIsModalOpen(true)
    }

    // Guardar empresa
    const handleSave = async () => {
        if (!validateForm()) return

        setIsSaving(true)
        try {
            if (editingEmpresa) {
                await updateEmpresa(editingEmpresa.id, formData)
            } else {
                await createEmpresa(formData)
            }
            const data = await getEmpresas()
            setEmpresas(data)
            setIsModalOpen(false)
        } catch (error: any) {
            setErrors({ cif: error.message || 'Error al guardar' })
        } finally {
            setIsSaving(false)
        }
    }

    // Confirmar eliminación
    const handleConfirmDelete = (empresa: EmpresaVendedora) => {
        setEmpresaToDelete(empresa)
        setIsDeleteModalOpen(true)
    }

    // Eliminar empresa
    const handleDelete = async () => {
        if (empresaToDelete) {
            await deleteEmpresa(empresaToDelete.id)
            const data = await getEmpresas()
            setEmpresas(data)
            setIsDeleteModalOpen(false)
            setEmpresaToDelete(null)
        }
    }

    // Toggle activa
    const handleToggleActiva = async (empresa: EmpresaVendedora) => {
        await toggleEmpresaActiva(empresa.id)
        const data = await getEmpresas()
        setEmpresas(data)
    }

    // Upload de logo
    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 2 * 1024 * 1024) {
            setErrors(prev => ({ ...prev, logo: 'El logo no puede superar 2MB' }))
            return
        }

        const reader = new FileReader()
        reader.onloadend = () => {
            updateField('logo', reader.result as string)
        }
        reader.readAsDataURL(file)
    }

    // Eliminar logo
    const handleRemoveLogo = () => {
        updateField('logo', '')
    }

    return (
        <div className="min-h-screen bg-[#f6f6f8]">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
                <div className="flex items-center justify-between px-4 md:px-6 py-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#135bec]">settings</span>
                            Gestión de Empresas Vendedoras
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Configura las empresas que aparecerán en contratos y facturas
                        </p>
                    </div>
                    <Button onClick={handleOpenCreate} className="bg-[#135bec] hover:bg-blue-700">
                        <span className="material-symbols-outlined mr-2 text-[18px]">add</span>
                        Nueva Empresa
                    </Button>
                </div>
            </header>

            {/* Content */}
            <main className="p-4 md:p-6">
                {/* Info banner si no hay empresas reales */}
                {empresas.every(e => e.es_ejemplo) && (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
                        <span className="material-symbols-outlined text-blue-500 mt-0.5">info</span>
                        <div>
                            <p className="text-sm font-medium text-blue-800">
                                Configura tus empresas vendedoras
                            </p>
                            <p className="text-sm text-blue-600 mt-1">
                                Las empresas de ejemplo están marcadas con una etiqueta. Puedes editarlas o crear nuevas.
                            </p>
                        </div>
                    </div>
                )}

                {/* Grid de empresas */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {empresas.map(empresa => (
                        <div
                            key={empresa.id}
                            className={cn(
                                "bg-white rounded-xl border shadow-sm overflow-hidden transition-all",
                                empresa.activa ? "border-slate-200" : "border-slate-300 opacity-60"
                            )}
                        >
                            {/* Header con logo */}
                            <div className="p-4 border-b border-slate-100 bg-slate-50">
                                <div className="flex items-center gap-3">
                                    {empresa.logo ? (
                                        <img
                                            src={empresa.logo}
                                            alt={empresa.nombre_comercial}
                                            className="h-14 w-14 object-contain rounded-lg bg-white border border-slate-200"
                                        />
                                    ) : (
                                        <div className="h-14 w-14 rounded-lg bg-gradient-to-br from-[#135bec] to-blue-600 flex items-center justify-center">
                                            <span className="text-white font-bold text-xl">
                                                {empresa.nombre_comercial.charAt(0)}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-slate-900 truncate">
                                                {empresa.nombre_comercial}
                                            </h3>
                                            {empresa.es_ejemplo && (
                                                <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-medium">
                                                    EJEMPLO
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-500 font-mono">{empresa.cif}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Contenido */}
                            <div className="p-4 space-y-3">
                                <div className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-slate-400 text-[18px] mt-0.5">location_on</span>
                                    <p className="text-sm text-slate-600">
                                        {empresa.direccion}, {empresa.codigo_postal} {empresa.localidad}
                                    </p>
                                </div>
                                {empresa.telefono && (
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-slate-400 text-[18px]">phone</span>
                                        <p className="text-sm text-slate-600">{empresa.telefono}</p>
                                    </div>
                                )}
                                {empresa.email && (
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-slate-400 text-[18px]">mail</span>
                                        <p className="text-sm text-slate-600 truncate">{empresa.email}</p>
                                    </div>
                                )}

                                {/* Estado */}
                                <div className="flex items-center justify-between pt-2">
                                    <button
                                        onClick={() => handleToggleActiva(empresa)}
                                        className={cn(
                                            "flex items-center gap-1.5 text-sm font-medium px-2 py-1 rounded-full transition-colors",
                                            empresa.activa
                                                ? "bg-green-100 text-green-700 hover:bg-green-200"
                                                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                        )}
                                    >
                                        <span className={cn(
                                            "w-2 h-2 rounded-full",
                                            empresa.activa ? "bg-green-500" : "bg-slate-400"
                                        )} />
                                        {empresa.activa ? 'Activa' : 'Inactiva'}
                                    </button>

                                    {/* Acciones */}
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleOpenEdit(empresa)}
                                            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">edit</span>
                                        </button>
                                        <button
                                            onClick={() => handleConfirmDelete(empresa)}
                                            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-red-50 text-slate-500 hover:text-red-500 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Card para añadir nueva */}
                    <button
                        onClick={handleOpenCreate}
                        className="bg-white rounded-xl border-2 border-dashed border-slate-300 min-h-[200px] flex flex-col items-center justify-center gap-3 hover:border-[#135bec] hover:bg-blue-50/50 transition-colors group"
                    >
                        <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-[#135bec]/10 transition-colors">
                            <span className="material-symbols-outlined text-slate-400 text-[28px] group-hover:text-[#135bec]">add</span>
                        </div>
                        <span className="text-slate-500 font-medium group-hover:text-[#135bec]">
                            Añadir nueva empresa
                        </span>
                    </button>
                </div>
            </main>

            {/* Modal Crear/Editar */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#135bec]">business</span>
                            {editingEmpresa ? 'Editar Empresa' : 'Nueva Empresa Vendedora'}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* Logo */}
                        <div className="flex items-center gap-4">
                            {formData.logo ? (
                                <img
                                    src={formData.logo}
                                    alt="Logo"
                                    className="h-20 w-20 object-contain rounded-lg border border-slate-200"
                                />
                            ) : (
                                <div className="h-20 w-20 rounded-lg bg-slate-100 flex items-center justify-center border-2 border-dashed border-slate-300">
                                    <span className="material-symbols-outlined text-slate-400 text-[28px]">image</span>
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label className="text-sm text-slate-500">Logo de la empresa</Label>
                                <div className="flex gap-2">
                                    <label className="cursor-pointer">
                                        <input
                                            type="file"
                                            accept="image/png,image/jpeg,image/svg+xml"
                                            onChange={handleLogoUpload}
                                            className="hidden"
                                        />
                                        <span className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-[#135bec] bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                                            <span className="material-symbols-outlined text-[16px]">upload</span>
                                            Subir logo
                                        </span>
                                    </label>
                                    {formData.logo && (
                                        <button
                                            onClick={handleRemoveLogo}
                                            className="px-3 py-1.5 text-sm font-medium text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                                        >
                                            Eliminar
                                        </button>
                                    )}
                                </div>
                                {errors.logo && <p className="text-xs text-red-500">{errors.logo}</p>}
                            </div>
                        </div>

                        {/* Datos identificativos */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                Datos identificativos
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Nombre comercial *</Label>
                                    <Input
                                        value={formData.nombre_comercial}
                                        onChange={(e) => updateField('nombre_comercial', e.target.value)}
                                        placeholder="Ej: Loredana SLU"
                                        className={errors.nombre_comercial ? 'border-red-500' : ''}
                                    />
                                    {errors.nombre_comercial && (
                                        <p className="text-xs text-red-500">{errors.nombre_comercial}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label>CIF *</Label>
                                    <Input
                                        value={formData.cif}
                                        onChange={(e) => updateField('cif', e.target.value.toUpperCase())}
                                        placeholder="Ej: B12345678"
                                        maxLength={9}
                                        className={cn("font-mono", errors.cif ? 'border-red-500' : '')}
                                    />
                                    {errors.cif && <p className="text-xs text-red-500">{errors.cif}</p>}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Razón social *</Label>
                                <Input
                                    value={formData.razon_social}
                                    onChange={(e) => updateField('razon_social', e.target.value)}
                                    placeholder="Ej: Loredana Sociedad Limitada Unipersonal"
                                    className={errors.razon_social ? 'border-red-500' : ''}
                                />
                                {errors.razon_social && (
                                    <p className="text-xs text-red-500">{errors.razon_social}</p>
                                )}
                            </div>
                        </div>

                        {/* Dirección fiscal */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                Dirección fiscal
                            </h4>
                            <div className="space-y-2">
                                <Label>Dirección *</Label>
                                <Input
                                    value={formData.direccion}
                                    onChange={(e) => updateField('direccion', e.target.value)}
                                    placeholder="Calle, número, portal, piso"
                                    className={errors.direccion ? 'border-red-500' : ''}
                                />
                                {errors.direccion && <p className="text-xs text-red-500">{errors.direccion}</p>}
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Código postal *</Label>
                                    <Input
                                        value={formData.codigo_postal}
                                        onChange={(e) => updateField('codigo_postal', e.target.value.replace(/\D/g, '').slice(0, 5))}
                                        placeholder="28001"
                                        maxLength={5}
                                        className={errors.codigo_postal ? 'border-red-500' : ''}
                                    />
                                    {errors.codigo_postal && (
                                        <p className="text-xs text-red-500">{errors.codigo_postal}</p>
                                    )}
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <Label>Localidad *</Label>
                                    <Input
                                        value={formData.localidad}
                                        onChange={(e) => updateField('localidad', e.target.value)}
                                        placeholder="Madrid"
                                        className={errors.localidad ? 'border-red-500' : ''}
                                    />
                                    {errors.localidad && (
                                        <p className="text-xs text-red-500">{errors.localidad}</p>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Provincia *</Label>
                                <Select
                                    value={formData.provincia}
                                    onValueChange={(v) => updateField('provincia', v)}
                                >
                                    <SelectTrigger className={errors.provincia ? 'border-red-500' : ''}>
                                        <SelectValue placeholder="Seleccionar provincia" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PROVINCIAS.map(prov => (
                                            <SelectItem key={prov} value={prov}>{prov}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.provincia && <p className="text-xs text-red-500">{errors.provincia}</p>}
                            </div>
                        </div>

                        {/* Contacto */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                Datos de contacto
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Teléfono</Label>
                                    <Input
                                        value={formData.telefono}
                                        onChange={(e) => updateField('telefono', e.target.value)}
                                        placeholder="912 345 678"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => updateField('email', e.target.value)}
                                        placeholder="contacto@empresa.com"
                                        className={errors.email ? 'border-red-500' : ''}
                                    />
                                    {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Página web</Label>
                                <Input
                                    value={formData.web}
                                    onChange={(e) => updateField('web', e.target.value)}
                                    placeholder="www.empresa.com"
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-[#135bec] hover:bg-blue-700"
                        >
                            {isSaving ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined mr-2 text-[18px]">save</span>
                                    {editingEmpresa ? 'Guardar cambios' : 'Crear empresa'}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Confirmar Eliminación */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <span className="material-symbols-outlined">warning</span>
                            Eliminar Empresa
                        </DialogTitle>
                    </DialogHeader>

                    <div className="py-4">
                        <p className="text-slate-600">
                            ¿Estás seguro de que quieres eliminar la empresa{' '}
                            <strong>{empresaToDelete?.nombre_comercial}</strong>?
                        </p>
                        <p className="text-sm text-slate-500 mt-2">
                            Esta acción no se puede deshacer. Los contratos y facturas existentes conservarán los datos.
                        </p>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleDelete}
                            className="bg-red-500 hover:bg-red-600 text-white"
                        >
                            <span className="material-symbols-outlined mr-2 text-[18px]">delete</span>
                            Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
