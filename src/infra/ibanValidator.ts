import assert from 'assert';
import { fetch } from '@erfanium/fetch-typebox';
import { TypeCompiler } from '@sinclair/typebox/compiler';
import { Type } from '@sinclair/typebox';
import createError from '@fastify/error';
const { IBAN_VALIDATOR_URL } = process.env;
const CANT_VALIDATE_IBAN = createError(
  'CANT_VALIDATE_IBAN',
  'we can not validate you iban',
  400,
);
const ibanValidatorResponse = TypeCompiler.Compile(
  Type.Object({
    bic: Type.String(),
    bank: Type.String(),
  }),
);

export default async function (
  iban: string,
): Promise<{ bic: string; bankName: string }> {
  // validating iban
  assert(IBAN_VALIDATOR_URL);
  const result = await fetch(`${IBAN_VALIDATOR_URL}/v1/validate/${iban}`, {
    method: 'GET',
  });
  if (!result.ok) throw new CANT_VALIDATE_IBAN();
  const jsonResult = await result.json(ibanValidatorResponse);
  return { bic: jsonResult.bic, bankName: jsonResult.bank };
}
