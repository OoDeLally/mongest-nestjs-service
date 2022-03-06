import { EntityPayload } from './types';

// Known limitations:
// Mongo's projection has much more features than just deciding whether we include a given field or not.
// e.g. it cannot also create a derivate field from existing ones.
// However in this context we'll keep it simple.

// Note: // Type `Truthy` cannot be expressed in TS because we cannot exclude a set e.g. type Truthy = ((number | boolean) \ Falsy)
// The only way to evaluate truthy is to first evaluate NOT Falsy, and then evaluate (number | boolean).
type Falsy = 0 | false;

export type MongoProjection = Record<string, number | boolean | string>;

export type RecordValuesUnion<R extends EntityPayload> = R extends Record<string, infer V>
  ? V
  : never;

// type RVU1 = RecordValuesUnion<{ a: 1; b: 1 }>;
// type RVU2 = RecordValuesUnion<{ a: 1; b: false }>;
// type RVU3 = RecordValuesUnion<{ a: 0; b: 0; c: false }>;

type IsMixedProjection<R extends EntityPayload> = Extract<RecordValuesUnion<R>, Falsy> extends never
  ? false
  : Exclude<RecordValuesUnion<R>, Falsy> extends never
  ? false
  : true;

// type Tmp = Exclude<RVU3, Falsy>

// type CI1 = IsMixedProjection<{ a: 1; b: 1 }>;
// type CI2 = IsMixedProjection<{ a: 1; b: false }>;
// type CI3 = IsMixedProjection<{ a: 0; b: 0; c: false }>;

type IsEmptyObject<T> = T extends Record<string, never> ? true : false;

type OmitId<P extends Record<string, unknown>> = {
  [Key in keyof P]: Key extends '_id' ? never : P[Key];
};

export type IsInclusionProjection<P extends MongoProjection> = IsEmptyObject<P> extends true
  ? false // e.g. {}
  : RecordValuesUnion<OmitId<P>> extends never
  ? // The projection only contains `_id` and no other field.
    P['_id'] extends Falsy
    ? false // e.g. {_id: false}
    : P['_id'] extends number | boolean | string
    ? true // e.g. {_id: true}
    : never // invalid projection e.g. {a: true, b: false}
  : IsMixedProjection<P> extends true
  ? never // invalid projections e.g. {a: 0, b: 1}
  : Exclude<RecordValuesUnion<OmitId<P>>, Falsy> extends never
  ? false // Exclusion projection e.g. {a: 0, b: false}
  : true; // {a: 1, b: 'foo'}

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
