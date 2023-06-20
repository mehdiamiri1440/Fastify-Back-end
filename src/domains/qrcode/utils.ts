import createError from '@fastify/error';
import Pino from 'pino';

const logger = Pino({ name: 'qr_code' });
const NOT_FOUND = createError('NOT_FOUND', 'QR code not found', 404);

const { QR_CODE_URL_TEMPLATE } = process.env;
if (!QR_CODE_URL_TEMPLATE) {
  logger.warn(
    'QR_CODE_URL_TEMPLATE env var is missing. dummy qr-code links will be created',
  );
}

const urlTemplate = QR_CODE_URL_TEMPLATE ?? 'https://example.com/{code}';
if (!urlTemplate.includes('{code}')) {
  throw new Error(
    'QR_CODE_URL_TEMPLATE env var is invalid. must include {code}',
  );
}

export enum QrCodeType {
  PRODUCT = 'PR',
  INBOUND = 'IN',
  OUTBOUND = 'OT',
  CUSTOMER = 'CU',
}

export function inferCodeType(code: string): QrCodeType {
  if (code.startsWith('PR')) {
    return QrCodeType.PRODUCT;
  }
  if (code.startsWith('IN')) {
    return QrCodeType.INBOUND;
  }
  if (code.startsWith('OT')) {
    return QrCodeType.OUTBOUND;
  }
  if (code.startsWith('CU')) {
    return QrCodeType.CUSTOMER;
  }

  throw new NOT_FOUND();
}

export function getAsLink(code: string) {
  return urlTemplate.replace('{code}', code);
}
