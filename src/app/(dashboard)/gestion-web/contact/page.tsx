"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { getAllConfigs, updateConfig, WebConfig } from "@/lib/web-content-service"
import { ContentInputField } from "@/components/web-management/ContentInputField"

export default function ContactPage() {
  const [configs, setConfigs] = useState<WebConfig[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [savedFields, setSavedFields] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadConfigs()
  }, [])

  const loadConfigs = async () => {
    setIsLoading(true)
    const data = await getAllConfigs()
    setConfigs(data)
    setIsLoading(false)
  }

  const handleChange = useCallback((clave: string, valor: string) => {
    setConfigs(prev => prev.map(c =>
      c.clave === clave ? { ...c, valor } : c
    ))
  }, [])

  const handleSave = useCallback(async (clave: string) => {
    const config = configs.find(c => c.clave === clave)
    if (!config) return

    setIsSaving(true)
    const success = await updateConfig(clave, config.valor)

    if (success) {
      setSavedFields(prev => new Set(prev).add(clave))
      setTimeout(() => {
        setSavedFields(prev => {
          const next = new Set(prev)
          next.delete(clave)
          return next
        })
      }, 2000)
    }

    setIsSaving(false)
  }, [configs])

  const getConfigValue = useCallback((clave: string) => {
    return configs.find(c => c.clave === clave)?.valor || ''
  }, [configs])

  // Categorize configs
  const contactFields = [
    { clave: 'telefono', label: 'Teléfono principal', icon: 'phone' },
    { clave: 'whatsapp', label: 'WhatsApp (solo números)', icon: 'chat' },
    { clave: 'email', label: 'Email de contacto', icon: 'email' },
  ]

  const addressFields = [
    { clave: 'direccion_calle', label: 'Calle y número' },
    { clave: 'direccion_cp', label: 'Código postal' },
    { clave: 'direccion_ciudad', label: 'Ciudad' },
    { clave: 'direccion_provincia', label: 'Provincia' },
    { clave: 'google_maps_url', label: 'URL de Google Maps' },
  ]

  const scheduleFields = [
    { clave: 'horario_lunes_jueves', label: 'Lunes a Jueves' },
    { clave: 'horario_viernes', label: 'Viernes' },
    { clave: 'horario_sabado', label: 'Sábado' },
    { clave: 'horario_domingo', label: 'Domingo' },
  ]

  const socialFields = [
    { clave: 'facebook_url', label: 'Facebook', icon: 'facebook' },
    { clave: 'instagram_url', label: 'Instagram', icon: 'instagram' },
    { clave: 'youtube_url', label: 'YouTube', icon: 'youtube' },
    { clave: 'twitter_url', label: 'Twitter / X', icon: 'twitter' },
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f6f6f8] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#135bec]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f6f6f8]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-4 md:px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/gestion-web"
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-slate-600">arrow_back</span>
            </Link>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-red-500">contact_phone</span>
                Información de Contacto
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Datos de contacto mostrados en la web
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
        {/* Contact Info */}
        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-500" style={{ fontSize: '20px' }}>call</span>
              Datos de Contacto
            </h2>
          </div>
          <div className="p-5 space-y-4">
            {contactFields.map(field => (
              <div key={field.clave} className="flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '20px' }}>
                  {field.icon}
                </span>
                <div className="flex-1">
                  <ContentInputField
                    clave={field.clave}
                    label={field.label}
                    value={getConfigValue(field.clave)}
                    onChange={handleChange}
                    onSave={handleSave}
                    isSaving={isSaving}
                    isSaved={savedFields.has(field.clave)}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Address */}
        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-500" style={{ fontSize: '20px' }}>location_on</span>
              Dirección
            </h2>
          </div>
          <div className="p-5 space-y-4">
            {addressFields.map(field => (
              <ContentInputField
                key={field.clave}
                clave={field.clave}
                label={field.label}
                value={getConfigValue(field.clave)}
                onChange={handleChange}
                onSave={handleSave}
                isSaving={isSaving}
                isSaved={savedFields.has(field.clave)}
              />
            ))}
          </div>
        </section>

        {/* Schedule */}
        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500" style={{ fontSize: '20px' }}>schedule</span>
              Horario de Atención
            </h2>
          </div>
          <div className="p-5 space-y-4">
            {scheduleFields.map(field => (
              <ContentInputField
                key={field.clave}
                clave={field.clave}
                label={field.label}
                value={getConfigValue(field.clave)}
                onChange={handleChange}
                onSave={handleSave}
                isSaving={isSaving}
                isSaved={savedFields.has(field.clave)}
              />
            ))}
          </div>
        </section>

        {/* Social Media */}
        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-purple-500" style={{ fontSize: '20px' }}>share</span>
              Redes Sociales
            </h2>
          </div>
          <div className="p-5 space-y-4">
            {socialFields.map(field => (
              <ContentInputField
                key={field.clave}
                clave={field.clave}
                label={field.label}
                value={getConfigValue(field.clave)}
                onChange={handleChange}
                onSave={handleSave}
                isSaving={isSaving}
                isSaved={savedFields.has(field.clave)}
                placeholder="https://..."
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
