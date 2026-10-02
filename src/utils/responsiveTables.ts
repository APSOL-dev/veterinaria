/**
 * Prepara las tablas para mostrarse como tarjetas en pantallas angostas.
 * Copia el texto de cada encabezado (<th>) como atributo data-label en las celdas de su columna,
 * y marca la tabla con data-cards. El CSS (index.css) usa esos atributos en pantallas <= 768px.
 * Las tablas con data-no-cards, o sin encabezados, se dejan como están.
 */
export const MOBILE_TABLE_QUERY = '(max-width: 768px)';

export function enhanceTable(table: HTMLTableElement): void {
  if (table.hasAttribute('data-no-cards')) return;

  const headerRow = table.querySelector('thead tr');
  if (!headerRow) return;

  // Etiqueta por índice de columna, respetando colSpan en los encabezados
  const labels: string[] = [];
  headerRow.querySelectorAll('th').forEach((th) => {
    const span = Math.max(1, Number((th as HTMLTableCellElement).colSpan) || 1);
    const text = (th.textContent || '').replace(/\s+/g, ' ').trim();
    for (let i = 0; i < span; i += 1) labels.push(text);
  });
  if (labels.length === 0) return;

  table.setAttribute('data-cards', '');

  table.querySelectorAll('tbody tr').forEach((row) => {
    let column = 0;
    Array.from(row.children).forEach((cell) => {
      const td = cell as HTMLTableCellElement;
      if (td.tagName !== 'TD' && td.tagName !== 'TH') return;
      const span = Math.max(1, td.colSpan || 1);
      const label = span > 1 ? '' : (labels[column] || '');
      if (td.getAttribute('data-label') !== label) td.setAttribute('data-label', label);
      column += span;
    });
  });
}

export function enhanceTablesIn(root: ParentNode): void {
  root.querySelectorAll('table').forEach((table) => enhanceTable(table as HTMLTableElement));
}

/**
 * Observa el contenido principal y re-etiqueta las tablas cuando React las vuelve a dibujar.
 * Devuelve una función para detener la observación.
 */
export function watchResponsiveTables(root: HTMLElement): () => void {
  let scheduled = false;
  const run = () => {
    scheduled = false;
    enhanceTablesIn(root);
  };
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(run);
  };

  enhanceTablesIn(root);
  const observer = new MutationObserver(schedule);
  observer.observe(root, { childList: true, subtree: true });
  return () => observer.disconnect();
}
