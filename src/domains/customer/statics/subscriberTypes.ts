import { StringEnum } from '$src/infra/TypeboxTypes';
import { Static } from '@sinclair/typebox';

export const businessSubscriberTypes = ['empresa'] as const;

export const normalSubscriberTypes = [
  'residential',
  'autono',
  'extranger',
] as const;

export const allSubscriberTypes = [
  ...businessSubscriberTypes,
  ...normalSubscriberTypes,
] as const;

export type SubscriberType = (typeof allSubscriberTypes)[number];

const businessSubscriberTypesSchema = StringEnum([...businessSubscriberTypes]);

export function isBusiness(
  subscriberType: SubscriberType,
): subscriberType is Static<typeof businessSubscriberTypesSchema> {
  return businessSubscriberTypes.includes(
    subscriberType as Static<typeof businessSubscriberTypesSchema>,
  );
}
