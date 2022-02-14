import { ObjectId } from 'mongodb';
import { EntityPayload } from './types';

// Known limitations:
// Mongo's projection has much more features than just deciding whether we include a given field or not.
// e.g. it can also create a derivate field from existing ones.
// However in this context we'll keep it simple.

type Truthy = 1 | true;
type Falsy = 0 | false;
export type TruthyOrFalsy = Truthy | Falsy;

export type MongoProjection =
  | {
      _id?: TruthyOrFalsy;
    }
  | OmitId<Record<string, Truthy>>
  | OmitId<Record<string, Falsy>>;

export type RecordAggregatedValues<R extends EntityPayload> = R extends Record<string, infer V>
  ? V
  : never;

type IsEmptyObject<T> = T extends Record<string, never> ? true : false;

type OmitId<P extends Record<string, unknown>> = {
  [Key in keyof P]: Key extends '_id' ? never : P[Key];
};

export type IsWhitelistProjection<P extends MongoProjection> = IsEmptyObject<P> extends true
  ? false // e.g. {}
  : RecordAggregatedValues<OmitId<P>> extends never
  ? P['_id'] extends Truthy
    ? true // e.g. {_id: true}
    : P['_id'] extends Falsy
    ? false // e.g. {_id: false}
    : never // invalid projection e.g. {a: true, b: false}
  : RecordAggregatedValues<OmitId<P>> extends Truthy
  ? true // Whitelist e.g. {a: 1}
  : RecordAggregatedValues<OmitId<P>> extends Falsy
  ? false // Blacklist e.g. {a: 0}
  : never; // other invalid projections.

export type NeverIfFalsyId<Key, P extends MongoProjection> = Key extends '_id'
  ? P['_id'] extends Falsy
    ? never
    : Key
  : Key;

type EntityIdOrDefault<E extends EntityPayload> = '_id' extends keyof E ? E['_id'] : ObjectId;

type AddOrRemoveIdFromWhiteProjection<
  Keys extends string,
  P extends MongoProjection,
> = P['_id'] extends false ? Exclude<Keys, '_id'> : Keys | '_id';

type AddOrRemoveIdFromBlackProjection<
  Keys extends string,
  P extends MongoProjection,
> = P['_id'] extends false ? Keys | '_id' : Exclude<Keys, '_id'>;

export type Projected<
  EntityDoc extends EntityPayload,
  P extends MongoProjection,
> = IsEmptyObject<P> extends true
  ? EntityDoc // e.g. {}
  : IsWhitelistProjection<P> extends never
  ? never // invalid projection e.g. {a: true, b: false}
  : IsWhitelistProjection<P> extends true
  ? Pick<
      EntityDoc,
      keyof EntityDoc & AddOrRemoveIdFromWhiteProjection<string & keyof EntityDoc & keyof P, P>
    > & {
      [Key in Exclude<keyof P, keyof EntityDoc>]: unknown;
    }
  : Omit<EntityDoc, AddOrRemoveIdFromBlackProjection<string & keyof P, P>>;

export type Projected1<
  EntityDoc extends EntityPayload,
  P extends MongoProjection,
> = IsEmptyObject<P> extends true
  ? EntityDoc // e.g. {}
  : IsWhitelistProjection<P> extends never
  ? never // invalid projection e.g. {a: true, b: false}
  : IsWhitelistProjection<P> extends true
  ? {
      // Whitelist e.g. {a: 1}
      [Key in '_id' | keyof P as NeverIfFalsyId<Key, P>]: Key extends '_id'
        ? EntityIdOrDefault<EntityDoc>
        : Key extends keyof EntityDoc
        ? EntityDoc[Key]
        : unknown;
    }
  : {
      // Blacklist e.g. {a: 0}
      [Key in '_id' | Exclude<keyof EntityDoc, keyof P> as NeverIfFalsyId<
        Key,
        P
      >]: Key extends '_id'
        ? EntityIdOrDefault<EntityDoc>
        : Key extends keyof EntityDoc
        ? EntityDoc[Key]
        : undefined;
    };
