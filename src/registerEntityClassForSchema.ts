import { Type } from '@nestjs/common';
import { Schema, SchemaDefinition } from 'mongoose';

// While the schema object seems to change, we assume schema.obj is an invariant, and
// can be relied on to identify the schema.

const classPerSchema = new Map<SchemaDefinition<unknown>, Type<object>>();

export const registerEntityClassForSchema = (documentClass: Type<object>, schema: Schema): void => {
  classPerSchema.set(schema.obj, documentClass);
};

export const getEntityClassForSchema = (schema: Schema): Type<object> | undefined => {
  return classPerSchema.get(schema.obj);
};
