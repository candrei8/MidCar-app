/**
 * Tests del modal de resultado de importación de pólizas.
 * Cubren los dos fallos vistos con el listado real de AXA (93 pólizas):
 *  - el botón de confirmar debe estar SIEMPRE presente aunque el listado
 *    sea grande (antes quedaba cortado por overflow sin scroll)
 *  - la asignación manual a vehículo debe funcionar con el buscador de
 *    botones (el <select> nativo no respondía dentro del diálogo)
 */
import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import { ImportPreviewModal, ImportResult, ParsedPolicy } from '../ImportPreviewModal'
import type { Vehicle } from '@/types'

// Radix Dialog necesita estos mocks en jsdom
beforeAll(() => {
    Element.prototype.scrollIntoView = jest.fn()
    Element.prototype.hasPointerCapture = jest.fn()
    global.ResizeObserver = jest.fn().mockImplementation(() => ({
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
    }))
})

function makePolicy(matricula: string): ParsedPolicy {
    return {
        numeroPoliza: `030-0047248350-${matricula}`,
        numeroPolizaGenerado: true,
        matricula,
        fechaAlta: null,
        fechaVencimiento: null,
        tipoPoliza: 'Todo Riesgo',
        aseguradora: 'Axa',
    }
}

function makeResult(matched: number, unmatched: number): ImportResult {
    return {
        totalPolicies: matched + unmatched,
        matched: Array.from({ length: matched }, (_, i) => ({
            policy: makePolicy(`${1000 + i}BBB`),
            vehicleId: `vm-${i}`,
            vehicleName: `Marca Modelo ${i}`,
            matricula: `${1000 + i}BBB`,
        })),
        unmatched: Array.from({ length: unmatched }, (_, i) => makePolicy(`${5000 + i}CCC`)),
        vehiclesWithoutPolicy: ['0102LFG', '9502KYR'],
    }
}

const vehiculos = [
    { id: 'v1', marca: 'Ford', modelo: 'Transit Connect Van 1.5 TDCi', matricula: 'WEB-111' },
    { id: 'v2', marca: 'Peugeot', modelo: 'Partner', matricula: 'WEB-222' },
] as unknown as Vehicle[]

describe('ImportPreviewModal', () => {
    it('muestra el botón de confirmar aunque el listado sea grande (93 pólizas)', () => {
        render(
            <ImportPreviewModal
                open
                onClose={jest.fn()}
                result={makeResult(37, 56)}
                onConfirm={jest.fn()}
                isImporting={false}
                assignableVehicles={vehiculos}
                onAssignVehicle={jest.fn()}
            />
        )
        expect(screen.getByText('Confirmar Importación (37)')).toBeInTheDocument()
        expect(screen.getByText('Cancelar')).toBeInTheDocument()
    })

    it('el buscador de asignación abre, filtra y asigna el vehículo elegido', () => {
        const onAssignVehicle = jest.fn()
        const result = makeResult(0, 2)
        render(
            <ImportPreviewModal
                open
                onClose={jest.fn()}
                result={result}
                onConfirm={jest.fn()}
                isImporting={false}
                assignableVehicles={vehiculos}
                onAssignVehicle={onAssignVehicle}
            />
        )

        // Abrir el buscador de la primera matrícula sin coincidencia
        fireEvent.click(screen.getAllByText('Asignar a vehículo…')[0])
        const buscador = screen.getByPlaceholderText('Buscar por marca, modelo o matrícula…')
        expect(buscador).toBeInTheDocument()

        // Filtrar por marca
        fireEvent.change(buscador, { target: { value: 'ford' } })
        expect(screen.getByText(/Transit Connect/)).toBeInTheDocument()
        expect(screen.queryByText(/Partner/)).not.toBeInTheDocument()

        // Asignar
        fireEvent.click(screen.getByText(/Transit Connect/))
        expect(onAssignVehicle).toHaveBeenCalledWith(result.unmatched[0], 'v1')
    })

    it('deshabilita confirmar cuando no hay ninguna coincidencia', () => {
        render(
            <ImportPreviewModal
                open
                onClose={jest.fn()}
                result={makeResult(0, 3)}
                onConfirm={jest.fn()}
                isImporting={false}
            />
        )
        expect(screen.getByText('Confirmar Importación (0)').closest('button')).toBeDisabled()
    })
})
