import { Type } from '@sinclair/typebox';
import { cycleCountTypes } from '$src/domains/cyclecount/statics/cycleCountTypes';
import { cycleCountStates } from '$src/domains/cyclecount/statics/cycleCountStates';
import StringEnum from '$src/infra/utils/StringEnum';

export const cycleCountType = StringEnum([...cycleCountTypes]);
export const cycleCountState = StringEnum([...cycleCountStates]);

export const CycleCountSchema = Type.Object({
  id: Type.Number(),
  cycleCountState,
  cycleCountType,
  bin: Type.Union([Type.Null(), Type.Number()], { default: null }),
  product: Type.Union([Type.Null(), Type.Number()], { default: null }),
  checker: Type.Union([Type.Number(), Type.Null()]),
  creator: Type.Number(),
  createdAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
  updatedAt: Type.Union([Type.Date(), Type.String({ format: 'date-time' })]),
  deletedAt: Type.Union([
    Type.Date(),
    Type.String({ format: 'date-time' }),
    Type.Null(),
  ]),
});
