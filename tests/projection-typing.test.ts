/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-types */

import { ObjectId } from 'mongodb';
import { expectType } from 'tsd';
import { IsWhitelistProjection, MongoProjection, Projected } from '../src/projection';

const acceptProjection = <Proj extends MongoProjection>(_proj: Proj) => {
  // do nothin'
};

// @ts-expect-error invalid projection
expectType<MongoProjection>({ valid: 0, invalid: 42 });

// @ts-expect-error cannot be at the same time white and black list.
acceptProjection({ a: 1, extra: 0 });
// @ts-expect-error cannot use a widden type
acceptProjection<{ a: 1; extra: number }>({ a: 1, extra: 1 });
// Can use a specified type
acceptProjection<{ a: 1; extra: 1 }>({ a: 1, extra: 1 });

expectType<IsWhitelistProjection<{ extraA: 1; extraB: 1 }>>(true);

expectType<IsWhitelistProjection<{ extraA: 0; extraB: 0 }>>(false);

expectType<IsWhitelistProjection<{ _id: true }>>(true);

expectType<IsWhitelistProjection<{ _id: false }>>(false);

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
});

expectType<Projected<Foo, { a: 0; _id: true }>>({
  _id: new ObjectId(),
  b: 'string',
  c: 42,
});

expectType<Projected<Foo, { a: 1 }>>({
  _id: new ObjectId(),
  a: 42,
});

expectType<Projected<Foo, { a: 1; _id: true }>>({
  _id: new ObjectId(),
  a: 42,
});

expectType<Projected<Foo, { a: 1; _id: false }>>({
  a: 42,
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
});

expectType<Projected<Foo, { a: 0; extra: 0 }>>({
  _id: new ObjectId(),
  b: 'string',
  c: 42,
});
