import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'

// jsdom no trae TextEncoder/TextDecoder y jsPDF los necesita para generar PDFs
if (typeof global.TextEncoder === 'undefined') {
    global.TextEncoder = TextEncoder
    global.TextDecoder = TextDecoder
}

// Mock next/navigation
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        prefetch: jest.fn(),
        back: jest.fn(),
    }),
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
})
