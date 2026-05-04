import { BadRequestException } from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';

export function parseUploadedFile(
  buffer: Buffer,
  mimetype: string,
  originalname: string,
  expectedHeaders: string[],
): Record<string, string>[] {
  const ext = originalname.split('.').pop()?.toLowerCase();

  if (
    ext === 'xlsx' ||
    mimetype ===
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ) {
    return parseXLSX(buffer, expectedHeaders);
  }

  if (ext === 'csv' || mimetype === 'text/csv') {
    return parseCSV(buffer, expectedHeaders);
  }

  throw new BadRequestException(
    'Unsupported file type. Please upload a .csv or .xlsx file.',
  );
}

function parseCSV(
  buffer: Buffer,
  expectedHeaders: string[],
): Record<string, string>[] {
  const cleaned = buffer
    .toString('utf-8')
    .split('\n')
    .filter((line) => line.replace(/,/g, '').trim().length > 0)
    .join('\n');

  let rows: Record<string, string>[];

  try {
    rows = parse(cleaned, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Record<string, string>[];
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to parse CSV file';
    throw new BadRequestException(`Invalid CSV file: ${message}`);
  }

  return validateHeaders(rows, expectedHeaders);
}

function parseXLSX(
  buffer: Buffer,
  expectedHeaders: string[],
): Record<string, string>[] {
  let workbook: XLSX.WorkBook;

  try {
    workbook = XLSX.read(buffer, { type: 'buffer' });
  } catch {
    throw new BadRequestException(
      'Invalid XLSX file. Could not read the workbook.',
    );
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new BadRequestException('XLSX file has no sheets.');
  }

  const sheet = workbook.Sheets[sheetName];

  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
    defval: '',
    raw: false,
  });

  const filtered = rows.filter((row) =>
    Object.values(row).some((v) => String(v).trim().length > 0),
  );

  return validateHeaders(filtered, expectedHeaders);
}

function validateHeaders(
  rows: Record<string, string>[],
  expectedHeaders: string[],
): Record<string, string>[] {
  if (!rows || rows.length === 0) {
    throw new BadRequestException('No data found in the file.');
  }

  const actualHeaders = Object.keys(rows[0]);

  expectedHeaders.forEach((expected) => {
    if (!actualHeaders.includes(expected)) {
      throw new BadRequestException(
        `Invalid file format. Missing column: "${expected}". Expected columns: ${expectedHeaders.join(', ')}`,
      );
    }
  });

  return rows;
}
