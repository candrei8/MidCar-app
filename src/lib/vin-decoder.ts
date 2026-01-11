/**
 * VIN Decoder Service
 * 
 * Uses the free NHTSA VIN Decoder API to get real vehicle information.
 * https://vpic.nhtsa.dot.gov/api/
 */

export interface VINDecodedInfo {
    isValid: boolean
    manufacturer: string
    make: string
    model: string
    year: string
    vehicleType: string
    bodyClass: string
    driveType: string
    fuelType: string
    engineCylinders: string
    engineDisplacement: string
    transmission: string
    doors: string
    plantCountry: string
    plantCity: string
    errorMessage?: string
}

interface NHTSAResult {
    Variable: string
    Value: string | null
    ValueId: string | null
}

interface NHTSAResponse {
    Count: number
    Message: string
    SearchCriteria: string
    Results: NHTSAResult[]
}

// Fallback WMI codes for when API fails or for quick lookup
const WMI_CODES: Record<string, string> = {
    // Germany
    'WVW': 'Volkswagen', 'WV1': 'Volkswagen CV', 'WV2': 'Volkswagen CV',
    'WBA': 'BMW', 'WBS': 'BMW M', 'WBY': 'BMW i',
    'WDB': 'Mercedes-Benz', 'WDC': 'Mercedes-Benz', 'WDD': 'Mercedes-Benz',
    'WAU': 'Audi', 'WUA': 'Audi Quattro',
    'W0L': 'Opel',
    // France
    'VF1': 'Renault', 'VF3': 'Peugeot', 'VF7': 'Citroën',
    // Spain
    'VSS': 'SEAT', 'VR1': 'Citroën Spain', 'VSK': 'Nissan Spain',
    // Italy
    'ZFA': 'Fiat', 'ZFF': 'Ferrari', 'ZAM': 'Maserati', 'ZAR': 'Alfa Romeo',
    'ZLA': 'Lancia',
    // Japan
    'JTD': 'Toyota', 'JMZ': 'Mazda', 'JN1': 'Nissan', 'JHM': 'Honda',
    // UK
    'SAL': 'Land Rover', 'SAJ': 'Jaguar', 'SCC': 'Lotus',
    // Czech
    'TMB': 'Škoda', 'TRU': 'Audi Hungary',
    // Romania
    'UU1': 'Dacia',
    // Sweden
    'YV1': 'Volvo', 'YS3': 'Saab',
    // USA
    'WF0': 'Ford', '1FA': 'Ford', '1G1': 'Chevrolet', '1GC': 'GMC',
    '1HD': 'Harley-Davidson', '2HM': 'Hyundai USA', '5YJ': 'Tesla',
    // Korea
    'KMH': 'Hyundai', 'KNA': 'Kia', 'KNM': 'Renault Samsung',
}

// Year codes (position 10 of VIN)
const YEAR_CODES: Record<string, string> = {
    'A': '2010', 'B': '2011', 'C': '2012', 'D': '2013', 'E': '2014',
    'F': '2015', 'G': '2016', 'H': '2017', 'J': '2018', 'K': '2019',
    'L': '2020', 'M': '2021', 'N': '2022', 'P': '2023', 'R': '2024',
    'S': '2025', 'T': '2026', 'V': '2027', 'W': '2028', 'X': '2029', 'Y': '2030',
    '1': '2001', '2': '2002', '3': '2003', '4': '2004', '5': '2005',
    '6': '2006', '7': '2007', '8': '2008', '9': '2009',
}

/**
 * Quick VIN decode using WMI codes (no API call)
 */
export function decodeVINBasic(vin: string): { manufacturer: string; year: string } {
    const wmi = vin.slice(0, 3).toUpperCase()
    const yearCode = vin.charAt(9).toUpperCase()

    return {
        manufacturer: WMI_CODES[wmi] || 'Fabricante no identificado',
        year: YEAR_CODES[yearCode] || 'Año no identificado'
    }
}

/**
 * Full VIN decode using NHTSA API
 */
export async function decodeVINFull(vin: string): Promise<VINDecodedInfo> {
    // Start with basic decode as fallback
    const basic = decodeVINBasic(vin)

    const defaultResult: VINDecodedInfo = {
        isValid: true,
        manufacturer: basic.manufacturer,
        make: basic.manufacturer,
        model: '',
        year: basic.year,
        vehicleType: '',
        bodyClass: '',
        driveType: '',
        fuelType: '',
        engineCylinders: '',
        engineDisplacement: '',
        transmission: '',
        doors: '',
        plantCountry: '',
        plantCity: '',
    }

    try {
        const response = await fetch(
            `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?format=json`,
            {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                // Timeout after 5 seconds
                signal: AbortSignal.timeout(5000)
            }
        )

        if (!response.ok) {
            console.warn('NHTSA API error:', response.status)
            return defaultResult
        }

        const data: NHTSAResponse = await response.json()

        // Helper to get value by variable name
        const getValue = (variable: string): string => {
            const result = data.Results.find(r => r.Variable === variable)
            return result?.Value || ''
        }

        // Check for error codes
        const errorCode = getValue('Error Code')
        if (errorCode && errorCode !== '0') {
            return {
                ...defaultResult,
                isValid: false,
                errorMessage: getValue('Error Text') || 'VIN no válido'
            }
        }

        return {
            isValid: true,
            manufacturer: getValue('Manufacturer Name') || basic.manufacturer,
            make: getValue('Make') || basic.manufacturer,
            model: getValue('Model') || '',
            year: getValue('Model Year') || basic.year,
            vehicleType: getValue('Vehicle Type') || '',
            bodyClass: getValue('Body Class') || '',
            driveType: getValue('Drive Type') || '',
            fuelType: getValue('Fuel Type - Primary') || '',
            engineCylinders: getValue('Engine Number of Cylinders') || '',
            engineDisplacement: getValue('Displacement (L)') || '',
            transmission: getValue('Transmission Style') || '',
            doors: getValue('Doors') || '',
            plantCountry: getValue('Plant Country') || '',
            plantCity: getValue('Plant City') || '',
        }
    } catch (error) {
        console.warn('VIN decode failed, using basic decode:', error)
        return defaultResult
    }
}

/**
 * Validate VIN format (17 alphanumeric chars, no I, O, Q)
 */
export function validateVIN(vin: string): boolean {
    const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/i
    return VIN_REGEX.test(vin)
}
