import assert from 'assert';
import Pino from 'pino';

const logger = Pino({ name: 'pdf2_client' });

function isPdfInput(
  input: unknown,
): input is { pdf: string; images: string[]; pages: number } {
  if (typeof input !== 'object' || input === null) {
    return false;
  }
  const { pdf, images, pages } = input as {
    pdf?: unknown;
    images?: unknown;
    pages?: unknown;
  };
  if (
    typeof pdf !== 'string' ||
    !Array.isArray(images) ||
    !Number.isInteger(pages)
  ) {
    return false;
  }
  for (const image of images) {
    if (typeof image !== 'string') {
      return false;
    }
  }
  return true;
}

const { PDF2_ENDPOINT, PDF2_TOKEN } = process.env;

if (!PDF2_ENDPOINT || !PDF2_TOKEN) {
  logger.warn(
    'pdf2 client is disabled duo no PDF2_ENDPOINT and PDF2_TOKEN envs',
  );
}

// const convertPngToWebp = (image: Buffer) =>

class DetailedError extends Error {
  detail: any;
  constructor(message: string, detail: any) {
    super(message);
    this.detail = detail;
  }
}

async function request(path: string, params: unknown, method: 'get' | 'post') {
  assert(PDF2_ENDPOINT, 'PDF2_ENDPOINT env is required');
  assert(PDF2_TOKEN, 'PDF2_TOKEN env var is required');

  const response = await fetch(`${PDF2_ENDPOINT}/${path}`, {
    method: method,
    body: JSON.stringify(params ?? {}),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${PDF2_TOKEN}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new DetailedError(
      `Request failed with status code ${response.status}`,
      text,
    );
  }

  const body = await response.json();
  if (!isPdfInput(body)) {
    throw new DetailedError(
      `Request failed with status code ${response.status}. invalid response structure from pdf2 server`,
      body,
    );
  }

  return body;
}

function post(path: string, params = {}) {
  return request(path, params, 'post');
}

export async function htmlToPdf(
  html: string,
): Promise<{ pdf: Buffer; images: Buffer[]; pages: number }> {
  const result = await post('html/package', {
    html,
  });

  const { pdf, images: _images, pages } = result;

  return {
    pdf: Buffer.from(pdf, 'base64'),
    images: _images.map((image) => Buffer.from(image, 'base64')),
    pages,
  };
}
