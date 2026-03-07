export type CsvColumn<T> = {
  header: string;
  value: (row: T) => unknown;
};

function asString(value: unknown): string {
  if (value == null) return '';
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function escapeCsvCell(raw: string): string {
  // RFC4180-ish: wrap in quotes when needed; double internal quotes.
  const needsQuotes = /[",\r\n]/.test(raw);
  const escaped = raw.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

export function buildCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((c) => escapeCsvCell(c.header)).join(',');
  const lines = rows.map((row) =>
    columns
      .map((c) => escapeCsvCell(asString(c.value(row))))
      .join(',')
  );
  return [header, ...lines].join('\r\n') + '\r\n';
}

export function downloadTextFile(params: {
  filename: string;
  contents: string;
  mimeType?: string;
}): void {
  if (typeof window === 'undefined') return;
  const { filename, contents, mimeType } = params;
  const blob = new Blob([contents], {
    type: mimeType ?? 'text/plain;charset=utf-8;',
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

export async function exportTableToPdf(params: {
  filename: string;
  title?: string;
  headers: string[];
  rows: Array<Array<string | number>>;
}): Promise<void> {
  if (typeof window === 'undefined') return;
  const [{ jsPDF }, autoTableModule] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  if (params.title) {
    doc.setFontSize(14);
    doc.text(params.title, 40, 40);
  }

  const autoTable =
    (autoTableModule as unknown as { default?: unknown }).default ??
    (autoTableModule as unknown);

  if (typeof autoTable === 'function') {
    autoTable(doc, {
      head: [params.headers],
      body: params.rows,
      startY: params.title ? 60 : 40,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [45, 106, 79] },
      theme: 'striped',
      margin: { left: 40, right: 40 },
    });
  }

  doc.save(params.filename);
}

