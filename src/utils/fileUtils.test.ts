import { describe, it, expect } from 'vitest';
import { dataUrlToFile, toSafeFileName, getVoucherKind } from './fileUtils';

describe('fileUtils', () => {
  it('dataUrlToFile rebuilds a PDF file from a base64 data URL', async () => {
    const dataUrl = 'data:application/pdf;base64,' + btoa('%PDF-1.4 demo');
    const file = dataUrlToFile(dataUrl, 'factura.pdf');
    expect(file).not.toBeNull();
    expect(file!.name).toBe('factura.pdf');
    expect(file!.type).toBe('application/pdf');
    expect(file!.size).toBe('%PDF-1.4 demo'.length);
  });

  it('dataUrlToFile returns null for values that are not data URLs', () => {
    expect(dataUrlToFile('https://x.test/a.pdf', 'a.pdf')).toBeNull();
    expect(dataUrlToFile('', 'a.pdf')).toBeNull();
    expect(dataUrlToFile('data:application/pdf;base64,@@@no-base64@@@', 'a.pdf')).toBeNull();
  });

  it('toSafeFileName removes accents and unsafe characters but keeps the extension', () => {
    expect(toSafeFileName('Factura Nº 1361 (señal).pdf')).toBe('Factura_N_1361_senal_.pdf');
    expect(toSafeFileName('')).toBe('comprobante');
    expect(toSafeFileName('rec-123')).toBe('rec-123');
  });

  it('getVoucherKind tells PDFs and images apart', () => {
    expect(getVoucherKind('factura.PDF')).toBe('pdf');
    expect(getVoucherKind('foto.jpeg')).toBe('image');
    expect(getVoucherKind(undefined, 'data:application/pdf;base64,AAAA')).toBe('pdf');
    expect(getVoucherKind('planilla.xlsx')).toBe('other');
  });
});
