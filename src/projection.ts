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

export type IsInclusionProjection<P extends MongoProjection> = IsEmptyObject<P> extends true
  ? false // e.g. {}
  : RecordAggregatedValues<OmitId<P>> extends never
  ? P['_id'] extends Truthy
    ? true // e.g. {_id: true}
    : P['_id'] extends Falsy
    ? false // e.g. {_id: false}
    : never // invalid projection e.g. {a: true, b: false}
  : RecordAggregatedValues<OmitId<P>> extends Truthy
  ? true // Inclusion projection e.g. {a: 1}
  : RecordAggregatedValues<OmitId<P>> extends Falsy
  ? false // Exclusion projection e.g. {a: 0}
  : never; // other invalid projections.

export type NeverIfFalsyId<Key, P extends MongoProjection> = Key extends '_id'
  ? P['_id'] extends Falsy
    ? never
    : Key
  : Key;

type AddOrRemoveIdFromInclusionProjection<
  Keys extends string,
  P extends MongoProjection,
> = P['_id'] extends false ? Exclude<Keys, '_id'> : Keys | '_id';

type AddOrRemoveIdFromExclusionProjection<
  Keys extends string,
  P extends MongoProjection,
> = P['_id'] extends false ? Keys | '_id' : Exclude<Keys, '_id'>;

// Use `' _ip': never` as a (I)nclusion (P)rojection flag, so it doesnt get shown by IDEs.

export type Projected<
  EntityDoc extends EntityPayload,
  P extends MongoProjection,
> = IsEmptyObject<P> extends true
  ? EntityDoc // e.g. {}
  : IsInclusionProjection<P> extends never
  ? never // invalid projection e.g. {a: true, b: false}
  : IsInclusionProjection<P> extends true
  ? Pick<
      EntityDoc,
      keyof EntityDoc & AddOrRemoveIdFromInclusionProjection<string & keyof EntityDoc & keyof P, P>
    > & {
      [Key in Exclude<keyof P, keyof EntityDoc> | ' _ip']: Key extends ' _ip' ? never : unknown;
    }
  : Omit<EntityDoc, AddOrRemoveIdFromExclusionProjection<string & keyof P, P>>;
