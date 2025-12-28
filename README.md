# MidCar - Sistema de Gestión de Concesionario Premium

<div align="center">
  <h1>🚗 MidCar</h1>
  <p>Aplicación premium de gestión para concesionario de vehículos de segunda mano</p>
</div>

## ✨ Características

- **Dashboard Premium**: KPIs en tiempo real, gauges estilo velocímetro, gráficos de leads y ventas
- **CRM Completo**: Gestión de leads con integración de chatbot, timeline de interacciones
- **Inventario**: Vista grid/tabla, ficha completa de vehículos con 50+ campos
- **Analytics Chatbot**: Embudo de conversión, análisis de sentimiento, transcripciones
- **Reportes**: Ventas por marca, rotación de inventario, rendimiento de vendedores
- **Configuración**: Ajustes de negocio, chatbot IA, notificaciones, integraciones

## 🎨 Diseño

- Tema dark premium (#0a0a0a, #1a1a1a)
- Color de acento rojo (#dc2626)
- Tipografía Inter
- Animaciones sutiles
- Totalmente responsive

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui personalizado
- **Gráficos**: Recharts
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Chatbot IA**: Claude API (Anthropic)
- **Iconos**: Lucide React

## 🚀 Instalación

1. **Clonar el repositorio**
```bash
git clone <tu-repo>
cd MidCar
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env.local
# Edita .env.local con tus credenciales
```

4. **Ejecutar en desarrollo**
```bash
npm run dev
```

5. **Abrir en el navegador**
```
http://localhost:3000
```

## 📁 Estructura del Proyecto

```
src/
├── app/                    # Next.js App Router
│   ├── (dashboard)/       # Rutas protegidas
│   │   ├── dashboard/     # Dashboard principal
│   │   ├── crm/          # Gestión de leads
│   │   ├── inventario/   # Inventario de vehículos
│   │   ├── chatbot/      # Analytics del chatbot
│   │   ├── reportes/     # Reportes y análisis
│   │   └── configuracion/ # Ajustes
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/               # Componentes base (shadcn/ui)
│   ├── dashboard/        # Componentes del dashboard
│   ├── crm/             # Componentes del CRM
│   ├── inventory/        # Componentes del inventario
│   └── layout/          # Header, navegación
├── lib/
│   ├── utils.ts         # Utilidades
│   ├── constants.ts     # Constantes de la app
│   └── mock-data.ts     # Datos de prueba
└── types/               # Tipos TypeScript
```

## 🌐 Despliegue en Netlify

1. Conecta tu repositorio a Netlify
2. Configura las variables de entorno
3. El archivo `netlify.toml` ya está configurado

## 📝 Próximos Pasos

- [ ] Conectar con Supabase real
- [ ] Implementar autenticación
- [ ] Agregar chatbot IA funcional
- [ ] Configurar envío de emails
- [ ] Añadir más datos de prueba

## 📄 Licencia

Propiedad de MidCar - Todos los derechos reservados
