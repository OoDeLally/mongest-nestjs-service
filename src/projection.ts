/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { ObjectId } from 'mongodb';
import { EntityPayload, MongoDoc } from 'src/types';

// Known limitations:
// Mongo's projection has much more features than just deciding whether we include a given field or not.
// e.g. it can also create a derivate field from existing ones.
// However in this context we'll keep it simple.

type Truthy = 1 | true;
type Falsy = 0 | false;
export type TruthyOrFalsy = Truthy | Falsy;

export type MongoProjection<T = Record<string, unknown>> = { _id?: TruthyOrFalsy } & (
  | Partial<Record<Exclude<keyof T, '_id'>, Truthy>>
  | Partial<Record<Exclude<keyof T, '_id'>, Falsy>>
);

export type RecordAggregatedValues<R extends Record<string, unknown>> = R extends Record<
  string,
  infer V
>
  ? V
  : never;

type IsEmptyObject<T> = T extends Record<string, never> ? true : false;

type OmitId<P extends MongoProjection<unknown>> = {
  [Key in keyof P]: Key extends '_id' ? never : P[Key];
};

type IsWhitelistProjection<P extends MongoProjection<EntityPayload>> = IsEmptyObject<P> extends true
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

type NeverIfFalsyId<Key, P extends MongoProjection<MongoDoc<unknown>>> = Key extends '_id'
  ? P['_id'] extends Falsy
    ? never
    : Key
  : Key;

export type Projected<
  EntityDoc extends MongoDoc<EntityPayload, unknown>,
  P extends MongoProjection<EntityPayload>,
> = IsEmptyObject<P> extends true
  ? EntityDoc // e.g. {}
  : IsWhitelistProjection<P> extends never
  ? never // invalid projection e.g. {a: true, b: false}
  : IsWhitelistProjection<P> extends true
  ? {
      // Whitelist e.g. {a: 1}
      [Key in '_id' | keyof P as NeverIfFalsyId<Key, P>]: Key extends
        | '_id'
        | (keyof EntityDoc & keyof P)
        ? EntityDoc[Key]
        : unknown;
    }
  : {
      // Blacklist e.g. {a: 0}
      [Key in '_id' | Exclude<keyof EntityDoc, keyof P> as NeverIfFalsyId<Key, P>]: EntityDoc[Key];
    };

// For test purpose...
type Foo = {
  _id: ObjectId;
  a: number;
  b: string;
  c: number;
};
type EmptyProj = Projected<Foo, {}>;
type OnlyIdFalseProj = Projected<Foo, { _id: false }>;
type OnlyIdTrueProj = Projected<Foo, { _id: true }>;
type WhitelistProjIdUndefined = Projected<Foo, { a: 1 }>;
type WhitelistProjIdTrue = Projected<Foo, { a: 1; _id: true }>;
type WhitelistProjIdFalse = Projected<Foo, { a: 1; _id: false }>;
type BlacklistProjIdUndefined = Projected<Foo, { a: 0 }>;
type BlacklistProjIdTrue = Projected<Foo, { a: 0; _id: true }>;
type BlacklistProjIdFalse = Projected<Foo, { a: 0; _id: false }>;
type ProjWithInvalidWiddenExtras = Projected<MongoDoc<Foo>, { a: 1; extra: number }>;
type isInvalidListAWhitelist = IsWhitelistProjection<{ a: 1; extra: 0 }>;
type InvalidProj = Projected<MongoDoc<Foo>, { a: 1; extra: 0 }>;
type WhitelistProjWithExtras = Projected<MongoDoc<Foo>, { a: 1; extra: 1 }>;
type BlacklistProjWithExtras = Projected<MongoDoc<Foo>, { a: 0; extra: 0 }>;

// type isWL2 = IsWhitelistProjection<{ extraA: 1; extraB: 1 }>;
// type isWL3 = IsWhitelistProjection<{ extraA: 0; extraB: 0 }>;
