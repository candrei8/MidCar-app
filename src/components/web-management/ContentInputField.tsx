"use client"

import { memo } from "react"

interface ContentInputFieldProps {
  clave: string
  label: string
  value: string
  onChange: (clave: string, value: string) => void
  onSave: (clave: string) => void
  isSaving: boolean
  isSaved: boolean
  type?: string
  multiline?: boolean
  placeholder?: string
}

// Memoized para evitar re-renders innecesarios
export const ContentInputField = memo(function ContentInputField({
  clave,
  label,
  value,
  onChange,
  onSave,
  isSaving,
  isSaved,
  type = 'text',
  multiline = false,
  placeholder
}: ContentInputFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
      </label>
      <div className="flex gap-2">
        {multiline ? (
          <textarea
            value={value}
            onChange={(e) => onChange(clave, e.target.value)}
            rows={3}
            placeholder={placeholder}
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#135bec] focus:border-transparent resize-none"
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(clave, e.target.value)}
            placeholder={placeholder}
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#135bec] focus:border-transparent"
          />
        )}
        <button
          onClick={() => onSave(clave)}
          disabled={isSaving}
          className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
            isSaved
              ? 'bg-emerald-500 text-white'
              : 'bg-[#135bec] hover:bg-blue-700 text-white'
          }`}
        >
          {isSaved ? '✓' : 'Guardar'}
        </button>
      </div>
    </div>
  )
})
