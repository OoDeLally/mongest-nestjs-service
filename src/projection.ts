import { EntityPayload, MongoPrimitiveObject } from './types';

// Known limitations:
// Mongo's projection has much more features than just deciding whether we include a given field or not.
// e.g. it cannot also create a derivate field from existing ones.
// However in this context we'll keep it simple.

// Note: // Type `Truthy` cannot be expressed in TS because we cannot exclude a set e.g. type Truthy = ((number | boolean) \ Falsy)
// The only way to evaluate truthy is to first evaluate NOT Falsy, and then evaluate (number | boolean).
type Falsy = 0 | false;

export type MongoProjection = {
  [Key in string]: number | boolean | string;
};

export type RecordValuesUnion<R extends EntityPayload> = R extends Record<string, infer V>
  ? V
  : never;

// type RVU1 = RecordValuesUnion<{ a: 1; b: 1 }>;
// type RVU2 = RecordValuesUnion<{ a: 1; b: false }>;
// type RVU3 = RecordValuesUnion<{ a: 0; b: 0; c: false }>;

type IsMixedProjection<R extends EntityPayload> = Extract<RecordValuesUnion<R>, Falsy> extends never
  ? false // Exclusion projection => Not mixed => false
  : Exclude<RecordValuesUnion<R>, Falsy> extends never
  ? false // Inclusion projection => Not mixed => false
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
  : IsMixedProjection<OmitId<P>> extends true
  ? never // invalid projections e.g. {a: 0, b: 1}
  : Exclude<RecordValuesUnion<OmitId<P>>, Falsy> extends never
  ? false // Exclusion projection e.g. {a: 0, b: false}
  : true; // {a: 1, b: 'foo'}

type GetRootKey<Key extends string> = Key extends `${infer Prefix}.${string}` ? Prefix : Key;

// type Foo1 = GetRootKey<'foo.bar' | 'foo.baz' | 'yay'>;
// type Foo2 = GetRootKey<'foo'>;

type PickAndUnwrapIfMatchRootKey<Proj extends MongoProjection, RootKey extends string> = {
  [Key in keyof Proj as Key extends `${RootKey}.${infer ChildKey}` ? ChildKey : never]: Proj[Key];
};

// type Foo1 = PickAndUnwrapIfMatchRootKey<{ a: 1; 'd.f.g': 1; 'd.f.i': 1 }, 'd'>;

// type ExtractAndUnwrapIfMatchRootKey<
//   KeyList extends string,
//   RootKey extends string,
// > = KeyList extends `${RootKey}.${infer ChildKey}` ? ChildKey : never;

// type Foo1 = ExtractAndUnwrapIfMatchRootKey<'a.d' | 'a.e' | 'c.c', 'a'>

// type Foo = {
//   _id: ObjectId;
//   a: number;
//   b: string;
//   c: number;
//   d: {
//     e: string;
//     f: {
//       g: string;
//       h: string;
//     };
//   };
// };

type GetEntityValueTypeOrUnknown<D extends EntityPayload, K> = K extends keyof D ? D[K] : unknown;

type GetInclusiveProjectedKeys<P extends MongoProjection, IdSpecialTreatment = false> = string &
  (IdSpecialTreatment extends true
    ? Exclude<P['_id'], Falsy> extends never
      ? Exclude<keyof P, '_id'>
      : keyof P | '_id'
    : keyof P);

// Use `' _ip': never` as a (I)nclusion (P)rojection flag, so it doesnt get shown by IDEs.

type ComputeInclusiveProjectedValue<V, P extends MongoProjection> = V extends (infer Item)[] // Embedded array
  ? ComputeInclusiveProjectedValue<Item, P>[]
  : V extends object // Embedded object
  ? InclusiveProjected<V, P>
  : V; // Primitive value

type InclusiveProjected<
  D extends EntityPayload,
  P extends MongoProjection,
  IsRootProjection = false,
> = {
  [Key in
    | (IsRootProjection extends true ? ' _ip' : never)
    | GetRootKey<GetInclusiveProjectedKeys<P, IsRootProjection>>]: Key extends ' _ip'
    ? never
    : GetEntityValueTypeOrUnknown<D, Key> extends MongoPrimitiveObject
    ? GetEntityValueTypeOrUnknown<D, Key> // primitive object e.g. Date, ObjectId.
    : ComputeInclusiveProjectedValue<
        GetEntityValueTypeOrUnknown<D, Key>,
        PickAndUnwrapIfMatchRootKey<P, Key>
      >;
};

type GetExclusiveProjectedKeys<
  D extends EntityPayload,
  P extends MongoProjection,
  IdSpecialTreatment = false,
> = string &
  (IdSpecialTreatment extends true
    ? Exclude<P['_id'], Falsy> extends never // _id is Falsy
      ? Exclude<keyof D, '_id' | keyof P>
      : Exclude<keyof D, keyof P> | '_id'
    : Exclude<keyof D, keyof P>);

// type FooProj = { a: 0; 'd.f.g': 0 };

type ComputeExclusiveProjectedValue<V, P extends MongoProjection> = V extends (infer Item)[] // Embedded array
  ? ComputeExclusiveProjectedValue<Item, P>[]
  : V extends object // Embedded object
  ? ExclusiveProjected<V, P>
  : V; // Primitive value

type ExclusiveProjected<
  D extends EntityPayload,
  P extends MongoProjection,
  IsRootProjection = false,
> = {
  [Key in GetExclusiveProjectedKeys<D, P, IsRootProjection>]: GetEntityValueTypeOrUnknown<
    D,
    Key
  > extends MongoPrimitiveObject
    ? GetEntityValueTypeOrUnknown<D, Key>
    : ComputeExclusiveProjectedValue<
        GetEntityValueTypeOrUnknown<D, Key>,
        PickAndUnwrapIfMatchRootKey<P, Key>
      >;
};

export type Projected<
  D extends EntityPayload,
  P extends MongoProjection,
> = IsInclusionProjection<P> extends never
  ? never // invalid projection e.g. {a: 1, b: 0}
  : IsInclusionProjection<P> extends true
  ? InclusiveProjected<D, P, true>
  : IsInclusionProjection<P> extends false
  ? ExclusiveProjected<D, P, true>
  : never; // invalid projection (not sure whether that can happen)
