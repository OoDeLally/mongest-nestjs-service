/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-types */

import { ObjectId } from 'mongodb';
import { expectType } from 'tsd';
import { IsInclusionProjection, Projected } from '../src/projection';

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

expectType<Projected<Foo, { _id: false }>>(
  {} as {
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

expectType<Projected<Foo, { _id: true }>>(
  {} as {
    _id: ObjectId;
    ' _ip': never;
  },
);

expectType<Projected<Foo, { a: 0; _id: true }>>(
  {} as {
    _id: ObjectId;
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

expectType<Projected<Foo, { a: 1 }>>(
  {} as {
    _id: ObjectId;
    a: number;
    ' _ip': never;
  },
);

expectType<Projected<Foo, { a: 1; _id: true }>>(
  {} as {
    _id: ObjectId;
    a: number;
    ' _ip': never;
  },
);

expectType<Projected<Foo, { a: 1; _id: false }>>(
  {} as {
    a: number;
    ' _ip': never;
  },
);

expectType<Projected<Foo, { a: 0 }>>(
  {} as {
    _id: ObjectId;
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

expectType<Projected<Foo, { a: 0; _id: true }>>(
  {} as {
    _id: ObjectId;
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

expectType<Projected<Foo, { a: 0; _id: false }>>(
  {} as {
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

expectType<Projected<Foo, { a: 1; extra: 1 }>>(
  {} as {
    _id: ObjectId;
    a: number;
    extra: unknown;
    ' _ip': never;
  },
);

expectType<Projected<Foo, { a: 0; extra: 0 }>>(
  {} as {
    _id: ObjectId;
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

/** Nested fields */

type Bar = Projected<Foo, { a: 1; 'd.f.g': 1 }>;

expectType<Projected<Foo, { a: 1; 'd.f.g': 1 }>>(
  {} as {
    _id: ObjectId;
    a: number;
    d: {
      f: {
        g: string;
      };
    };
    ' _ip': never;
  },
);

expectType<{
  _id: ObjectId;
  a: number;
  d: {
    f: {
      g: string;
    };
  };
  ' _ip': never;
}>({} as Projected<Foo, { a: 1; 'd.f.g': 1 }>);
