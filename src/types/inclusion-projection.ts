import { GetEntityValueTypeOrUnknown, PickAndUnwrapIfMatchRootKey } from './projection-helpers';
import {
  EntityPayload,
  Falsy,
  MongoPrimitiveObject,
  MongoProjection,
  OmitId,
  OmitNeverValues,
} from './types';

// Known limitations: No $operator in projection.

type RecordValuesUnion<R extends EntityPayload> = R extends Record<string, infer V> ? V : never;

type IsMixedProjection<R extends EntityPayload> = Extract<RecordValuesUnion<R>, Falsy> extends never
  ? false // Exclusion projection => Not mixed => false
  : Exclude<RecordValuesUnion<R>, Falsy> extends never
  ? false // Inclusion projection => Not mixed => false
  : true;

type IsEmptyObject<T> = T extends Record<string, never> ? true : false;

export type IsInclusionProjection<P extends MongoProjection> = IsEmptyObject<P> extends true
  ? false // e.g. {}
  : keyof OmitId<P> extends never
  ? // The projection only contains `_id` and no other field.
    P['_id'] extends Falsy
    ? false // e.g. {_id: false}
    : P['_id'] extends number | boolean | string
    ? true // e.g. {_id: true}
    : never // invalid projection e.g. {a: true, b: false}
  : IsMixedProjection<OmitId<P>> extends true
  ? never // invalid projections e.g. {a: 0, b: 1}
  : Exclude<RecordValuesUnion<OmitId<P>>, Falsy> extends never
  ? false // Exclusion projection e.g. {a: 0, b: false}
  : true; // {a: 1, b: 'foo'}

type GetRootKey<Key extends string> = Key extends `${infer Prefix}.${string}` ? Prefix : Key;

type GetInclusionProjectedKeys<P extends MongoProjection, IdSpecialTreatment = false> = string &
  (IdSpecialTreatment extends true
    ? Exclude<P['_id'], Falsy> extends never
      ? Exclude<keyof P, '_id'>
      : keyof P | '_id'
    : keyof P);

// Use `' _ip': never` as a (I)nclusion (P)rojection flag, so it doesnt get shown by IDEs.

type ComputeInclusionProjectedValue<
  V,
  P extends MongoProjection,
  ResolvedRefs extends EntityPayload,
> = V extends (infer Item)[] // Embedded array
  ? ComputeInclusionProjectedValue<Item, P, ResolvedRefs>[]
  : V extends object // Embedded object
  ? InclusionProjected<V, P, ResolvedRefs>
  : V; // Primitive value

export type InclusionProjected<
  D extends EntityPayload,
  P extends MongoProjection,
  ResolvedRefs extends EntityPayload,
  IsRootProjection = false,
> = {
  [Key in
    | (IsRootProjection extends true ? ' _ip' : never)
    | GetRootKey<GetInclusionProjectedKeys<P, IsRootProjection>>]: Key extends ' _ip'
    ? never
    : Key extends keyof ResolvedRefs
    ? ResolvedRefs[Key]
    : P[Key] extends string
    ? P[Key] // Projection is using a direct primitive.
    : GetEntityValueTypeOrUnknown<D, Key> extends MongoPrimitiveObject
    ? GetEntityValueTypeOrUnknown<D, Key> // primitive object e.g. Date, ObjectId.
    : ComputeInclusionProjectedValue<
        GetEntityValueTypeOrUnknown<D, Key>,
        PickAndUnwrapIfMatchRootKey<P, Key>,
        PickAndUnwrapIfMatchRootKey<ResolvedRefs, Key>
      >;
};

type GetByPath<V, Path extends string> = V extends (infer Item)[]
  ? GetByPath<Item, Path>
  : V extends MongoPrimitiveObject
  ? never
  : Path extends keyof V
  ? V[Path]
  : Path extends `${infer RootKey}.${infer ChildKey}`
  ? RootKey extends keyof V
    ? GetByPath<V[RootKey], ChildKey>
    : never
  : never;

export type ResolveProjectionReference<
  D extends EntityPayload,
  P extends MongoProjection,
> = OmitNeverValues<{
  [Key in keyof P]: P[Key] extends `$${infer Path}` ? GetByPath<D, Path> : never;
}>;
