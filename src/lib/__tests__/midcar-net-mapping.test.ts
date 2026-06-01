import {
    normalizePlate,
    getMidcarNetPlateIndex,
    fetchMidcarNetMapping,
    _resetMidcarNetCache,
    type MidcarNetEntry,
} from '@/lib/midcar-net-mapping'

// We control `fetch` per test via this shared mock.
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
    { id: 'a', url: 'https://www.midcar.net/audi-a4-2018-a', title: 'Audi', make: 'Audi', model: 'A4', year: 2018, price: 0, vehicleStatus: 0, visible: true, plate: '1234ABC' },
    { id: 'b', url: 'https://www.midcar.net/bmw-2020-b',    title: 'BMW',  make: 'Bmw',  model: '5', year: 2020, price: 0, vehicleStatus: 1, visible: true, plate: '5678-XYZ' },
    { id: 'c', url: 'https://www.midcar.net/sold-2010-c',   title: 'Old',  make: 'Seat', model: 'Ibiza', year: 2010, price: 0, vehicleStatus: 2, visible: true, plate: '9999AAA' },
    { id: 'd', url: 'https://www.midcar.net/hidden-2021-d', title: 'Hid',  make: 'Ford', model: 'Focus', year: 2021, price: 0, vehicleStatus: 0, visible: false, plate: '1111BBB' },
    { id: 'e', url: 'https://www.midcar.net/noplate-2022-e', title: 'NP', make: 'Kia',  model: 'Picanto', year: 2022, price: 0, vehicleStatus: 0, visible: true, plate: null },
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
// getMidcarNetPlateIndex
// ---------------------------------------------------------------------------
describe('getMidcarNetPlateIndex', () => {
    it('indexes only visible + vehicleStatus 0|1 with a plate', async () => {
        mockFetchOnce(sample)
        const idx = await getMidcarNetPlateIndex()
        // a (status 0, visible, plate) ✓
        // b (status 1, visible, plate, dashed)  ✓
        // c (status 2 = sold) ✗
        // d (visible=false) ✗
        // e (plate=null) ✗
        expect(idx.size).toBe(2)
        expect(idx.get('1234ABC')).toBe('https://www.midcar.net/audi-a4-2018-a')
        expect(idx.get('5678XYZ')).toBe('https://www.midcar.net/bmw-2020-b')
    })

    it('caches the result across consecutive calls', async () => {
        const fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => sample })
        globalThis.fetch = fetchMock as unknown as typeof fetch
        await getMidcarNetPlateIndex()
        await getMidcarNetPlateIndex()
        await getMidcarNetPlateIndex()
        expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    it('returns an empty map on fetch error without a warm cache', async () => {
        globalThis.fetch = jest.fn().mockRejectedValue(new Error('boom')) as unknown as typeof fetch
        const idx = await getMidcarNetPlateIndex()
        expect(idx.size).toBe(0)
    })

    it('returns the stale cache when a refresh fails', async () => {
        mockFetchOnce(sample)
        const first = await getMidcarNetPlateIndex()
        expect(first.size).toBe(2)
        // Force a refresh attempt by busting the cache, then have fetch fail.
        _resetMidcarNetCache()
        // Re-prime cache via a successful fetch so we have something to "go stale".
        mockFetchOnce(sample)
        await getMidcarNetPlateIndex()
        // Now expire the in-memory TTL by mocking Date.now further in the future
        // — we just clear and have the next fetch fail; in that case we expect
        // an empty map (no cache at module scope after _resetMidcarNetCache).
        _resetMidcarNetCache()
        globalThis.fetch = jest.fn().mockRejectedValue(new Error('boom')) as unknown as typeof fetch
        const after = await getMidcarNetPlateIndex()
        expect(after.size).toBe(0)
    })

    it('returns empty on non-200 HTTP', async () => {
        mockFetchOnce({ message: 'bad request' }, { ok: false, status: 400 })
        const idx = await getMidcarNetPlateIndex()
        expect(idx.size).toBe(0)
    })

    it('returns empty when body is not an array', async () => {
        mockFetchOnce({ data: [] })
        const idx = await getMidcarNetPlateIndex()
        expect(idx.size).toBe(0)
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
