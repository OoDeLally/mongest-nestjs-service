/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-types */

import { ObjectId } from 'mongodb';
import { expectType } from 'tsd';
import { IsInclusionProjection, MongoProjection, Projected } from '../src/projection';

const WLP_MARKER = ' _ip' as const;

const acceptProjection = <Proj extends MongoProjection>(_proj: Proj) => {
  // do nothin'
};

// @ts-expect-error invalid projection
expectType<MongoProjection>({ valid: 0, invalid: 42 });

// @ts-expect-error cannot be at the same time inclusion and exclusion projection.
acceptProjection({ a: 1, extra: 0 });
// @ts-expect-error cannot use a widden type
acceptProjection<{ a: 1; extra: number }>({ a: 1, extra: 1 });
// Can use a specified type
acceptProjection<{ a: 1; extra: 1 }>({ a: 1, extra: 1 });

expectType<IsInclusionProjection<{ extraA: 1; extraB: 1 }>>(true);

expectType<IsInclusionProjection<{ extraA: 0; extraB: 0 }>>(false);

expectType<IsInclusionProjection<{ _id: true }>>(true);

expectType<IsInclusionProjection<{ _id: false }>>(false);

type Foo = {
  _id: ObjectId;
  a: number;
  b: string;
  c: number;
};

expectType<Projected<Foo, {}>>({
  _id: new ObjectId(),
  a: 42,
  b: 'string',
  c: 42,
});

expectType<Projected<Foo, { _id: false }>>({
  a: 42,
  b: 'string',
  c: 42,
});

expectType<Projected<Foo, { _id: true }>>({
  _id: new ObjectId(),
  [WLP_MARKER]: null as never,
});

expectType<Projected<Foo, { a: 0; _id: true }>>({
  _id: new ObjectId(),
  b: 'string',
  c: 42,
});

expectType<Projected<Foo, { a: 1 }>>({
  _id: new ObjectId(),
  a: 42,
  [WLP_MARKER]: null as never,
});

expectType<Projected<Foo, { a: 1; _id: true }>>({
  _id: new ObjectId(),
  a: 42,
  [WLP_MARKER]: null as never,
});

expectType<Projected<Foo, { a: 1; _id: false }>>({
  a: 42,
  [WLP_MARKER]: null as never,
});

expectType<Projected<Foo, { a: 0 }>>({
  _id: new ObjectId(),
  b: 'string',
  c: 42,
});

expectType<Projected<Foo, { a: 0; _id: true }>>({
  _id: new ObjectId(),
  b: 'string',
  c: 42,
});

expectType<Projected<Foo, { a: 0; _id: false }>>({
  b: 'string',
  c: 42,
});

expectType<Projected<Foo, { a: 1; extra: 1 }>>({
  _id: new ObjectId(),
  a: 42,
  extra: 'unknown',
} as {
  _id: ObjectId;
  a: number;
  extra: unknown;
  [WLP_MARKER]: never;
});

expectType<Projected<Foo, { a: 0; extra: 0 }>>({
  _id: new ObjectId(),
  b: 'string',
  c: 42,
});
