"use client"

import { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: string
}

export default function MarkdownEditor({
  value,
  onChange,
  placeholder = "Escribe el contenido...",
  minHeight = "400px"
}: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write')
  const [isFullscreen, setIsFullscreen] = useState(false)

  const insertMarkdown = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('markdown-textarea') as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    const newText = value.substring(0, start) + prefix + selectedText + suffix + value.substring(end)

    onChange(newText)

    // Reset cursor position
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + prefix.length + selectedText.length + suffix.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  const toolbarButtons = [
    { icon: 'format_bold', label: 'Negrita', action: () => insertMarkdown('**', '**') },
    { icon: 'format_italic', label: 'Cursiva', action: () => insertMarkdown('*', '*') },
    { icon: 'strikethrough_s', label: 'Tachado', action: () => insertMarkdown('~~', '~~') },
    { type: 'separator' },
    { icon: 'title', label: 'Título H2', action: () => insertMarkdown('\n## ', '\n') },
    { icon: 'format_h3', label: 'Título H3', action: () => insertMarkdown('\n### ', '\n') },
    { type: 'separator' },
    { icon: 'format_list_bulleted', label: 'Lista', action: () => insertMarkdown('\n- ') },
    { icon: 'format_list_numbered', label: 'Lista numerada', action: () => insertMarkdown('\n1. ') },
    { icon: 'check_box', label: 'Checklist', action: () => insertMarkdown('\n- [ ] ') },
    { type: 'separator' },
    { icon: 'link', label: 'Enlace', action: () => insertMarkdown('[', '](url)') },
    { icon: 'image', label: 'Imagen', action: () => insertMarkdown('![alt](', ')') },
    { icon: 'code', label: 'Código', action: () => insertMarkdown('`', '`') },
    { icon: 'data_object', label: 'Bloque código', action: () => insertMarkdown('\n```\n', '\n```\n') },
    { type: 'separator' },
    { icon: 'format_quote', label: 'Cita', action: () => insertMarkdown('\n> ') },
    { icon: 'horizontal_rule', label: 'Línea horizontal', action: () => insertMarkdown('\n---\n') },
  ]

  const containerClass = isFullscreen
    ? 'fixed inset-0 z-50 bg-white p-4 flex flex-col'
    : 'border border-slate-300 rounded-xl overflow-hidden'

  return (
    <div className={containerClass}>
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-2 py-1.5">
        <div className="flex items-center gap-0.5 flex-wrap">
          {toolbarButtons.map((btn, idx) =>
            btn.type === 'separator' ? (
              <div key={idx} className="w-px h-6 bg-slate-300 mx-1" />
            ) : (
              <button
                key={idx}
                onClick={btn.action}
                title={btn.label}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{btn.icon}</span>
              </button>
            )
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Tabs */}
          <div className="flex bg-slate-200 rounded-lg p-0.5">
            <button
              onClick={() => setActiveTab('write')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'write'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Escribir
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'preview'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Vista previa
            </button>
          </div>

          {/* Fullscreen toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors"
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
            </span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={`${isFullscreen ? 'flex-1 overflow-auto' : ''}`} style={{ minHeight: isFullscreen ? undefined : minHeight }}>
        {activeTab === 'write' ? (
          <textarea
            id="markdown-textarea"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full h-full p-4 resize-none focus:outline-none font-mono text-sm"
            style={{ minHeight: isFullscreen ? '100%' : minHeight }}
          />
        ) : (
          <div
            className="prose prose-slate max-w-none p-4 overflow-auto"
            style={{ minHeight: isFullscreen ? '100%' : minHeight }}
          >
            {value ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {value}
              </ReactMarkdown>
            ) : (
              <p className="text-slate-400 italic">Nada que mostrar todavía...</p>
            )}
          </div>
        )}
      </div>

      {/* Footer with stats */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-slate-200 bg-slate-50 text-xs text-slate-500">
        <span>
          {value.split(/\s+/).filter(Boolean).length} palabras ·
          {value.length} caracteres ·
          ~{Math.ceil(value.split(/\s+/).filter(Boolean).length / 200)} min lectura
        </span>
        <span>Markdown soportado</span>
      </div>
    </div>
  )
}
