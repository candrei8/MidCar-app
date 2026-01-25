"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

// Section cards data
const sections = [
  {
    id: 'hero',
    title: 'Hero / Banner Principal',
    description: 'Título, subtítulo, botones de acción y estadísticas de la página principal',
    icon: 'web',
    href: '/gestion-web/hero',
    color: 'bg-blue-500',
  },
  {
    id: 'about',
    title: 'Sobre Nosotros',
    description: 'Información de la empresa, historia, estadísticas y valores',
    icon: 'info',
    href: '/gestion-web/about',
    color: 'bg-emerald-500',
  },
  {
    id: 'benefits',
    title: 'Beneficios / Ventajas',
    description: 'Lista de ventajas de comprar en MID Car',
    icon: 'verified',
    href: '/gestion-web/benefits',
    color: 'bg-amber-500',
  },
  {
    id: 'warranty',
    title: 'Garantía',
    description: 'Información de garantía, qué cubre y qué no cubre',
    icon: 'shield',
    href: '/gestion-web/warranty',
    color: 'bg-purple-500',
  },
  {
    id: 'testimonials',
    title: 'Testimonios',
    description: 'Reseñas y opiniones de clientes',
    icon: 'rate_review',
    href: '/gestion-web/testimonials',
    color: 'bg-pink-500',
  },
  {
    id: 'faqs',
    title: 'Preguntas Frecuentes',
    description: 'FAQs de financiación y garantía',
    icon: 'help',
    href: '/gestion-web/faqs',
    color: 'bg-cyan-500',
  },
  {
    id: 'contact',
    title: 'Información de Contacto',
    description: 'Teléfono, email, dirección, horarios y redes sociales',
    icon: 'contact_phone',
    href: '/gestion-web/contact',
    color: 'bg-red-500',
  },
  {
    id: 'cta',
    title: 'Llamadas a la Acción',
    description: 'Textos de financiación y coche a la carta',
    icon: 'ads_click',
    href: '/gestion-web/cta',
    color: 'bg-indigo-500',
  },
]

export default function GestionWebPage() {
  return (
    <div className="min-h-screen bg-[#f6f6f8]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-4 md:px-6 py-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#135bec]">language</span>
              Gestión Web
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Edita el contenido de tu página web
            </p>
          </div>
          <a
            href="http://localhost:3001"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>open_in_new</span>
            Ver web
          </a>
        </div>
      </header>

      {/* Content */}
      <main className="p-4 md:p-6">
        {/* Info Banner */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-blue-600" style={{ fontSize: '24px' }}>info</span>
            <div>
              <p className="text-sm text-blue-800 font-medium">
                Los cambios se guardan automáticamente y se reflejan en la página web en tiempo real.
              </p>
              <p className="text-sm text-blue-600 mt-1">
                La web está conectada a la misma base de datos que este dashboard.
              </p>
            </div>
          </div>
        </div>

        {/* Section Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sections.map((section) => (
            <Link
              key={section.id}
              href={section.href}
              className="group bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg hover:border-slate-300 transition-all duration-200"
            >
              <div className="flex items-start gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center text-white",
                  section.color
                )}>
                  <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                    {section.icon}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 group-hover:text-[#135bec] transition-colors">
                    {section.title}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                    {section.description}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-end text-sm text-slate-400 group-hover:text-[#135bec] transition-colors">
                <span>Editar</span>
                <span className="material-symbols-outlined ml-1" style={{ fontSize: '18px' }}>
                  arrow_forward
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-blue-600" style={{ fontSize: '20px' }}>article</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">8</p>
                <p className="text-xs text-slate-500">Secciones</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-emerald-600" style={{ fontSize: '20px' }}>rate_review</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">3</p>
                <p className="text-xs text-slate-500">Testimonios</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-amber-600" style={{ fontSize: '20px' }}>help</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">4</p>
                <p className="text-xs text-slate-500">FAQs</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-purple-600" style={{ fontSize: '20px' }}>verified</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">6</p>
                <p className="text-xs text-slate-500">Beneficios</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
