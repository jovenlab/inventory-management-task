import { buildCsv } from './export';

describe('buildCsv', () => {
  it('escapes commas, quotes, and newlines', () => {
    const csv = buildCsv(
      [{ name: 'hello, "world"\nnext', qty: 3 }],
      [
        { header: 'Name', value: (r) => r.name },
        { header: 'Qty', value: (r) => r.qty },
      ]
    );

    expect(csv).toContain('Name,Qty\r\n');
    expect(csv).toContain('"hello, ""world""\nnext",3\r\n');
    expect(csv.endsWith('\r\n')).toBe(true);
  });
});

