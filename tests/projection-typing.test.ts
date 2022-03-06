/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-types */

import { ObjectId } from 'mongodb';
import { expectType } from 'tsd';
import { IsInclusionProjection, Projected } from '../src/projection';

const IP_MARKER = ' _ip' as const;

expectType<IsInclusionProjection<{}>>(false);
expectType<IsInclusionProjection<{ _id: true }>>(true);
expectType<IsInclusionProjection<{ _id: false }>>(false);
expectType<IsInclusionProjection<{ extraA: 1; extraB: 1 }>>(true);
expectType<IsInclusionProjection<{ extraA: 0; extraB: 0 }>>(false);
expectType<IsInclusionProjection<{ a: 1; b: 0 }>>({} as never);
expectType<IsInclusionProjection<{ _id: true; a: 0 }>>(false);
expectType<IsInclusionProjection<{ _id: false; a: 1 }>>(true);

type Foo = {
  _id: ObjectId;
  a: number;
  b: string;
  c: number;
  d: {
    e: string;
    f: {
      g: string;
      h: string;
    };
  };
};

expectType<Projected<Foo, {}>>(
  {} as {
    _id: ObjectId;
    a: number;
    b: string;
    c: number;
    d: {
      e: string;
      f: {
        g: string;
        h: string;
      };
    };
  },
);

expectType<Projected<Foo, { _id: false }>>({
  a: 42,
  b: 'string',
  c: 42,
  d: {
    e: 'eVal',
    f: {
      g: 'gVal',
      h: 'hVal',
    },
  },
});

expectType<Projected<Foo, { _id: true }>>({
  _id: new ObjectId(),
  [IP_MARKER]: null as never,
});

expectType<Projected<Foo, { a: 0; _id: true }>>({
  _id: new ObjectId(),
  b: 'string',
  c: 42,
  d: {
    e: 'eVal',
    f: {
      g: 'gVal',
      h: 'hVal',
    },
  },
});

expectType<Projected<Foo, { a: 1 }>>({
  _id: new ObjectId(),
  a: 42,
  [IP_MARKER]: null as never,
});

expectType<Projected<Foo, { a: 1; _id: true }>>({
  _id: new ObjectId(),
  a: 42,
  [IP_MARKER]: null as never,
});

expectType<Projected<Foo, { a: 1; _id: false }>>({
  a: 42,
  [IP_MARKER]: null as never,
});

expectType<Projected<Foo, { a: 0 }>>({
  _id: new ObjectId(),
  b: 'string',
  c: 42,
  d: {
    e: 'eVal',
    f: {
      g: 'gVal',
      h: 'hVal',
    },
  },
});

expectType<Projected<Foo, { a: 0; _id: true }>>({
  _id: new ObjectId(),
  b: 'string',
  c: 42,
  d: {
    e: 'eVal',
    f: {
      g: 'gVal',
      h: 'hVal',
    },
  },
});

expectType<Projected<Foo, { a: 0; _id: false }>>({
  b: 'string',
  c: 42,
  d: {
    e: 'eVal',
    f: {
      g: 'gVal',
      h: 'hVal',
    },
  },
});

expectType<Projected<Foo, { a: 1; extra: 1 }>>({
  _id: new ObjectId(),
  a: 42,
  extra: 'unknown',
} as {
  _id: ObjectId;
  a: number;
  extra: unknown;
  [IP_MARKER]: never;
});

expectType<Projected<Foo, { a: 0; extra: 0 }>>({
  _id: new ObjectId(),
  b: 'string',
  c: 42,
  d: {
    e: 'eVal',
    f: {
      g: 'gVal',
      h: 'hVal',
    },
  },
});

/** Nested fields */

expectType<Projected<Foo, { a: 1; 'd.f.g': 1 }>>({
  _id: new ObjectId(),
  a: 42,
  extra: 'unknown',
} as {
  _id: ObjectId;
  a: number;
  extra: unknown;
  [IP_MARKER]: never;
});
