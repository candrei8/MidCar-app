import type { Vehicle, Lead, Contact, Sale } from '@/types'

describe('Tipos - Vehicle', () => {
    it('tiene la estructura correcta', () => {
        const vehicle: Partial<Vehicle> = {
            id: 'test-123',
            vin: 'WVWZZZ3CZWE123456',
            matricula: '1234BCD',
            stock_id: 'STK-0001',
            estado: 'disponible',
            marca: 'Volkswagen',
            modelo: 'Golf',
            precio_venta: 15000,
            kilometraje: 50000,
        }

        expect(vehicle.id).toBeDefined()
        expect(vehicle.estado).toBe('disponible')
        expect(typeof vehicle.precio_venta).toBe('number')
    })

    it('acepta todos los estados válidos', () => {
        const estados: Vehicle['estado'][] = ['disponible', 'reservado', 'vendido', 'taller', 'baja']
        expect(estados.length).toBe(5)
    })

    it('acepta todos los tipos de combustible', () => {
        const combustibles: Vehicle['combustible'][] = ['gasolina', 'diesel', 'hibrido', 'electrico', 'glp', 'gnc']
        expect(combustibles.length).toBe(6)
    })

    it('acepta todas las transmisiones', () => {
        const transmisiones: Vehicle['transmision'][] = ['manual', 'automatico', 'semiautomatico']
        expect(transmisiones.length).toBe(3)
    })
})

describe('Tipos - Lead', () => {
    it('tiene la estructura correcta', () => {
        const lead: Partial<Lead> = {
            id: 'lead-123',
            cliente_id: 'cliente-456',
            vehiculo_id: 'vehiculo-789',
            estado: 'nuevo',
            prioridad: 'alta',
            probabilidad: 75,
        }

        expect(lead.id).toBeDefined()
        expect(lead.estado).toBe('nuevo')
        expect(lead.probabilidad).toBe(75)
    })

    it('acepta todos los estados de lead', () => {
        const estados: Lead['estado'][] = [
            'nuevo', 'contactado', 'visita_agendada', 'prueba_conduccion',
            'propuesta_enviada', 'negociacion', 'vendido', 'perdido'
        ]
        expect(estados.length).toBe(8)
    })

    it('acepta todas las prioridades', () => {
        const prioridades: Lead['prioridad'][] = ['baja', 'media', 'alta', 'urgente']
        expect(prioridades.length).toBe(4)
    })
})

describe('Tipos - Contact', () => {
    it('tiene la estructura correcta', () => {
        const contact: Partial<Contact> = {
            id: 'contact-123',
            telefono: '612345678',
            email: 'test@example.com',
            nombre: 'Juan',
            apellidos: 'García',
            origen: 'web',
            estado: 'nuevo',
        }

        expect(contact.id).toBeDefined()
        expect(contact.origen).toBe('web')
    })

    it('acepta todos los orígenes de contacto', () => {
        const origenes: Contact['origen'][] = [
            'web', 'telefono', 'presencial', 'whatsapp',
            'coches_net', 'wallapop', 'autocasion',
            'facebook', 'instagram', 'referido', 'otro'
        ]
        expect(origenes.length).toBe(11)
    })
})

describe('Tipos - Sale', () => {
    it('tiene la estructura correcta', () => {
        const sale: Partial<Sale> = {
            id: 'sale-123',
            numero_factura: 'FAC-2024-000001',
            cliente_id: 'cliente-456',
            vehiculo_id: 'vehiculo-789',
            precio_final: 15000,
            estado: 'completada',
        }

        expect(sale.id).toBeDefined()
        expect(sale.estado).toBe('completada')
    })

    it('acepta todos los estados de venta', () => {
        const estados: Sale['estado'][] = ['pendiente', 'completada', 'cancelada']
        expect(estados.length).toBe(3)
    })
})
