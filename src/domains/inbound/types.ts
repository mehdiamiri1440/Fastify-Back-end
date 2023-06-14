import { Type } from '@sinclair/typebox';

export const Quantity = () => Type.Integer({ minimum: 1 });
