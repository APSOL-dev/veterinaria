import { describe, it, expect } from 'vitest';
import { enhanceTable, enhanceTablesIn } from './responsiveTables';

const buildTable = (html: string): HTMLTableElement => {
  const host = document.createElement('div');
  host.innerHTML = html;
  return host.querySelector('table') as HTMLTableElement;
};

describe('responsiveTables', () => {
  it('labels each cell with the header of its column and marks the table', () => {
    const table = buildTable(`
      <table>
        <thead><tr><th>Vacuna</th><th> Frecuencia  / vigencia </th><th>Acciones</th></tr></thead>
        <tbody><tr><td>ANTIRRÁBICA</td><td>365 días</td><td><button>Editar</button></td></tr></tbody>
      </table>`);
    enhanceTable(table);

    const cells = table.querySelectorAll('tbody td');
    expect(table.hasAttribute('data-cards')).toBe(true);
    expect(cells[0].getAttribute('data-label')).toBe('Vacuna');
    expect(cells[1].getAttribute('data-label')).toBe('Frecuencia / vigencia');
    expect(cells[2].getAttribute('data-label')).toBe('Acciones');
  });

  it('keeps column alignment when a cell spans several columns and leaves it without label', () => {
    const table = buildTable(`
      <table>
        <thead><tr><th>A</th><th>B</th><th>C</th></tr></thead>
        <tbody>
          <tr><td colspan="3">No hay registros</td></tr>
          <tr><td colspan="2">Grupo</td><td>valor</td></tr>
        </tbody>
      </table>`);
    enhanceTable(table);

    const rows = table.querySelectorAll('tbody tr');
    expect(rows[0].children[0].getAttribute('data-label')).toBe('');
    expect(rows[1].children[0].getAttribute('data-label')).toBe('');
    expect(rows[1].children[1].getAttribute('data-label')).toBe('C');
  });

  it('skips tables without header row or marked with data-no-cards', () => {
    const noHead = buildTable('<table><tbody><tr><td>x</td></tr></tbody></table>');
    const optOut = buildTable('<table data-no-cards><thead><tr><th>A</th></tr></thead><tbody><tr><td>x</td></tr></tbody></table>');
    enhanceTable(noHead);
    enhanceTable(optOut);

    expect(noHead.hasAttribute('data-cards')).toBe(false);
    expect(optOut.hasAttribute('data-cards')).toBe(false);
    expect(optOut.querySelector('td')?.hasAttribute('data-label')).toBe(false);
  });

  it('updates labels on a second pass (rows redrawn by React) and enhances every table in a root', () => {
    const host = document.createElement('div');
    host.innerHTML = `
      <table><thead><tr><th>Col</th></tr></thead><tbody></tbody></table>
      <table><thead><tr><th>Otra</th></tr></thead><tbody><tr><td>v</td></tr></tbody></table>`;
    enhanceTablesIn(host);
    const first = host.querySelectorAll('table')[0];
    first.querySelector('tbody')!.innerHTML = '<tr><td>nuevo</td></tr>';
    enhanceTablesIn(host);

    expect(first.querySelector('td')?.getAttribute('data-label')).toBe('Col');
    expect(host.querySelectorAll('table')[1].querySelector('td')?.getAttribute('data-label')).toBe('Otra');
  });
});
