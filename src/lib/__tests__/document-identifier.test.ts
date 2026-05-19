import { buildDocumentIdentifier, getVerificationUrl } from '../documents/identifier';

describe('MidCar document identifier', () => {
  it('builds a deterministic identifier for the same inputs', () => {
    const a = buildDocumentIdentifier({
      type: 'compraventa',
      numeroDocumento: 'CV-2026-0001',
      vin: 'WBAJC91030G943910',
      dni: 'X6444856A',
      fecha: '2026-01-13'
    });
    const b = buildDocumentIdentifier({
      type: 'compraventa',
      numeroDocumento: 'CV-2026-0001',
      vin: 'WBAJC91030G943910',
      dni: 'X6444856A',
      fecha: '2026-01-13'
    });
    expect(a).toBe(b);
    expect(a).toMatch(/^MID-CV-2026-0001-[A-Z0-9]{8}$/);
  });

  it('changes when VIN or DNI changes', () => {
    const a = buildDocumentIdentifier({
      type: 'factura',
      numeroDocumento: 'FA-2026-0001',
      vin: 'AAA',
      dni: 'X'
    });
    const b = buildDocumentIdentifier({
      type: 'factura',
      numeroDocumento: 'FA-2026-0001',
      vin: 'AAB',
      dni: 'X'
    });
    expect(a).not.toBe(b);
  });

  it('uses different type prefixes', () => {
    const cv = buildDocumentIdentifier({ type: 'compraventa', numeroDocumento: '0001' });
    const sn = buildDocumentIdentifier({ type: 'senal', numeroDocumento: '0001' });
    const fa = buildDocumentIdentifier({ type: 'factura', numeroDocumento: '0001' });
    const pf = buildDocumentIdentifier({ type: 'proforma', numeroDocumento: '0001' });
    expect(cv.split('-')[1]).toBe('CV');
    expect(sn.split('-')[1]).toBe('SN');
    expect(fa.split('-')[1]).toBe('FA');
    expect(pf.split('-')[1]).toBe('PF');
  });

  it('produces a verification URL on the midcar.es domain', () => {
    const id = buildDocumentIdentifier({ type: 'proforma', numeroDocumento: 'PF-2026-1740' });
    expect(getVerificationUrl(id)).toBe(`https://midcar.es/v/${id}`);
  });
});
