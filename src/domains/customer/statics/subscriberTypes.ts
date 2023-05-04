import StringEnum from '$src/infra/StringEnum';
import { Static } from '@sinclair/typebox';

export const businessSubscriberTypes = ['empresa'] as const;

export const normalSubscriberTypes = [
  'dropdown',
  'residential',
  'autono',
  'extranger',
] as const;

export const allSubscriberTypes = [
  ...businessSubscriberTypes,
  ...normalSubscriberTypes,
] as const;

const businessSubscriberTypesSchema = StringEnum([...businessSubscriberTypes]);
const normalSubscriberTypesSchema = StringEnum([...normalSubscriberTypes]);
export function isBusiness(
  subscriberType:
    | Static<typeof businessSubscriberTypesSchema>
    | Static<typeof normalSubscriberTypesSchema>,
): subscriberType is Static<typeof businessSubscriberTypesSchema> {
  return businessSubscriberTypes.includes(
    subscriberType as Static<typeof businessSubscriberTypesSchema>,
  );
}
