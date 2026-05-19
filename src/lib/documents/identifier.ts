import QRCode from 'qrcode';
import { DocumentType } from './document-types';

const TYPE_PREFIX: Record<DocumentType, string> = {
  compraventa: 'CV',
  senal: 'SN',
  factura: 'FA',
  proforma: 'PF'
};

export interface MidCarDocumentIdentifier {
  id: string;
  verificationUrl: string;
  qrDataUrl: string;
}

const VERIFICATION_BASE_URL = 'https://midcar.es/v/';

function hashString(input: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0xdeadbeef;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 = Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 = Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  const combined = ((h1 >>> 0).toString(36) + (h2 >>> 0).toString(36)).toUpperCase();
  return combined.slice(0, 8).padEnd(8, '0');
}

export function buildDocumentIdentifier(params: {
  type: DocumentType;
  numeroDocumento: string;
  vin?: string;
  dni?: string;
  fecha?: string;
}): string {
  const year = (params.fecha ? new Date(params.fecha) : new Date()).getFullYear();
  const seqMatch = params.numeroDocumento.match(/(\d+)$/);
  const sequence = (seqMatch ? seqMatch[1] : '0000').padStart(4, '0');
  const fingerprint = hashString(
    `${params.type}|${params.vin || ''}|${params.dni || ''}|${params.numeroDocumento}|${year}`
  );
  return `MID-${TYPE_PREFIX[params.type]}-${year}-${sequence}-${fingerprint}`;
}

export function getVerificationUrl(identifier: string): string {
  return `${VERIFICATION_BASE_URL}${identifier}`;
}

export async function generateIdentifierQRDataUrl(identifier: string): Promise<string> {
  const url = getVerificationUrl(identifier);
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 256,
    color: {
      dark: '#1E293B',
      light: '#FFFFFF'
    }
  });
}

export async function buildFullIdentifier(params: {
  type: DocumentType;
  numeroDocumento: string;
  vin?: string;
  dni?: string;
  fecha?: string;
}): Promise<MidCarDocumentIdentifier> {
  const id = buildDocumentIdentifier(params);
  const verificationUrl = getVerificationUrl(id);
  const qrDataUrl = await generateIdentifierQRDataUrl(id);
  return { id, verificationUrl, qrDataUrl };
}
