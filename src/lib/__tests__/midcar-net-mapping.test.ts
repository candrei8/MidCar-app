import {
    normalizePlate,
    getMidcarNetVisibleEntries,
    fetchMidcarNetMapping,
    _resetMidcarNetCache,
    type MidcarNetEntry,
} from '@/lib/midcar-net-mapping'

const originalFetch = globalThis.fetch
beforeEach(() => {
    _resetMidcarNetCache()
})
afterEach(() => {
    globalThis.fetch = originalFetch
})

function mockFetchOnce(body: unknown, init?: { ok?: boolean; status?: number }) {
    const ok = init?.ok ?? true
    const status = init?.status ?? (ok ? 200 : 500)
    globalThis.fetch = jest.fn().mockResolvedValue({
        ok,
        status,
        json: async () => body,
    }) as unknown as typeof fetch
}

const sample: MidcarNetEntry[] = [
    { id: 'a', url: 'https://www.midcar.net/audi-a4-2018-a',  title: 'Audi A4',     make: 'Audi', model: 'A4',     year: 2018, price: 15000, vehicleStatus: 0, visible: true,  plate: '1234ABC' },
    { id: 'b', url: 'https://www.midcar.net/bmw-2020-b',      title: 'BMW Serie 5', make: 'Bmw',  model: 'Serie 5',year: 2020, price: 25000, vehicleStatus: 1, visible: true,  plate: '5678-XYZ' },
    { id: 'c', url: 'https://www.midcar.net/sold-2010-c',     title: 'Old',         make: 'Seat', model: 'Ibiza',  year: 2010, price: 5000,  vehicleStatus: 2, visible: true,  plate: '9999AAA' },
    { id: 'd', url: 'https://www.midcar.net/hidden-2021-d',   title: 'Hid',         make: 'Ford', model: 'Focus',  year: 2021, price: 10000, vehicleStatus: 0, visible: false, plate: '1111BBB' },
    { id: 'e', url: 'https://www.midcar.net/noplate-2022-e',  title: 'NP',          make: 'Kia',  model: 'Picanto',year: 2022, price: 8000,  vehicleStatus: 0, visible: true,  plate: null },
]

// ---------------------------------------------------------------------------
// normalizePlate
// ---------------------------------------------------------------------------
describe('normalizePlate', () => {
    it('strips whitespace and dashes, uppercases', () => {
        expect(normalizePlate('1234 ABC')).toBe('1234ABC')
        expect(normalizePlate('1234-abc')).toBe('1234ABC')
        expect(normalizePlate(' 1234  abc ')).toBe('1234ABC')
        expect(normalizePlate('1234abc')).toBe('1234ABC')
    })

    it('returns null for empty/whitespace/nullish', () => {
        expect(normalizePlate(null)).toBeNull()
        expect(normalizePlate(undefined)).toBeNull()
        expect(normalizePlate('')).toBeNull()
        expect(normalizePlate('   ')).toBeNull()
        expect(normalizePlate(' - ')).toBeNull()
    })
})

// ---------------------------------------------------------------------------
// getMidcarNetVisibleEntries
// ---------------------------------------------------------------------------
describe('getMidcarNetVisibleEntries', () => {
    it('returns only visible + vehicleStatus 0|1 (en venta / reservado)', async () => {
        mockFetchOnce(sample)
        const entries = await getMidcarNetVisibleEntries()
        // a (status 0, visible) ✓, b (status 1, visible) ✓, e (plate null but still visible+venta) ✓
        // c (status 2 = sold) ✗, d (visible=false) ✗
        expect(entries.map(e => e.id).sort()).toEqual(['a', 'b', 'e'])
    })

    it('caches the result across consecutive calls', async () => {
        const fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => sample })
        globalThis.fetch = fetchMock as unknown as typeof fetch
        await getMidcarNetVisibleEntries()
        await getMidcarNetVisibleEntries()
        await getMidcarNetVisibleEntries()
        expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    it('returns an empty list on fetch error without a warm cache', async () => {
        globalThis.fetch = jest.fn().mockRejectedValue(new Error('boom')) as unknown as typeof fetch
        const entries = await getMidcarNetVisibleEntries()
        expect(entries).toEqual([])
    })

    it('returns empty on non-200 HTTP', async () => {
        mockFetchOnce({ message: 'bad request' }, { ok: false, status: 400 })
        const entries = await getMidcarNetVisibleEntries()
        expect(entries).toEqual([])
    })

    it('returns empty when body is not an array', async () => {
        mockFetchOnce({ data: [] })
        const entries = await getMidcarNetVisibleEntries()
        expect(entries).toEqual([])
    })
})

// ---------------------------------------------------------------------------
// fetchMidcarNetMapping (raw)
// ---------------------------------------------------------------------------
describe('fetchMidcarNetMapping', () => {
    it('returns the parsed array verbatim on 200', async () => {
        mockFetchOnce(sample)
        const out = await fetchMidcarNetMapping()
        expect(out).toEqual(sample)
    })

    it('throws on non-200', async () => {
        mockFetchOnce({}, { ok: false, status: 503 })
        await expect(fetchMidcarNetMapping()).rejects.toThrow(/503/)
    })

    it('throws on non-array body', async () => {
        mockFetchOnce({ entries: sample })
        await expect(fetchMidcarNetMapping()).rejects.toThrow(/non-array/)
    })
})
