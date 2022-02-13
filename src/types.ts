import { ObjectId } from 'mongodb';

// Do NOT use EntityPayload = Record<string, unknown>. Even if in practice it is the case,
// TS considers that classes can be indexed by non-string keys.
export type EntityPayload = object;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AbstractType<T = any> = abstract new (...args: any[]) => T;

export type ExtractIdType<EDoc extends EntityPayload> = '_id' extends keyof EDoc
  ? EDoc['_id']
  : ObjectId;

export type OmitId<EDoc extends EntityPayload> = Omit<EDoc, '_id'>;
