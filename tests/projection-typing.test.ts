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
      i: string;
    };
  }[];
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
        i: string;
      };
    }[];
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
        i: string;
      };
    }[];
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
        i: string;
      };
    }[];
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
        i: string;
      };
    }[];
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
        i: string;
      };
    }[];
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
        i: string;
      };
    }[];
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
        i: string;
      };
    }[];
  },
);

/** Nested fields */

/** Nested inclusion projection */
expectType<Projected<Foo, { a: 1; 'd.f.g': 1 }>>(
  {} as {
    _id: ObjectId;
    a: number;
    d: {
      f: {
        g: string;
      };
    }[];
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
  }[];
  ' _ip': never;
}>({} as Projected<Foo, { a: 1; 'd.f.g': 1 }>);

expectType<Projected<Foo, { a: 1; 'd.f.g': 1; 'd.f.i': 1 }>>(
  {} as {
    _id: ObjectId;
    a: number;
    d: {
      f: {
        g: string;
        i: string;
      };
    }[];
    ' _ip': never;
  },
);

expectType<{
  _id: ObjectId;
  a: number;
  d: {
    f: {
      g: string;
      i: string;
    };
  }[];
  ' _ip': never;
}>({} as Projected<Foo, { a: 1; 'd.f.g': 1; 'd.f.i': 1; 'd.e': 1 }>);

/** Nested exclusion projection */

expectType<Projected<Foo, { a: 0; 'd.f.g': 0 }>>(
  {} as {
    _id: ObjectId;
    b: string;
    c: number;
    d: {
      e: string;
      f: {
        h: string;
        i: string;
      };
    }[];
  },
);

expectType<{
  _id: ObjectId;
  b: string;
  c: number;
  d: {
    e: string;
    f: {
      h: string;
      i: string;
    };
  }[];
}>({} as Projected<Foo, { a: 0; 'd.f.g': 0 }>);

/** Unecessary projection */
expectType<Projected<Foo, { a: 0; d: 0; 'd.f.g': 0 }>>(
  {} as {
    _id: ObjectId;
    b: string;
    c: number;
    d: {
      e: string;
      f: {
        h: string;
        i: string;
      };
    }[];
  },
);

expectType<{
  _id: ObjectId;
  b: string;
  c: number;
}>({} as Projected<Foo, { a: 0; d: 0; 'd.f.g': 0 }>);

/** Multiple projection with shared path prefix */
expectType<Projected<Foo, { a: 0; 'd.f.g': 0; 'd.f.i': 0 }>>(
  {} as {
    _id: ObjectId;
    b: string;
    c: number;
    d: {
      e: string;
      f: {
        h: string;
      };
    }[];
  },
);

expectType<{
  _id: ObjectId;
  b: string;
  c: number;
  d: {
    e: string;
    f: {
      h: string;
    };
  }[];
}>({} as Projected<Foo, { a: 0; 'd.f.g': 0; 'd.f.i': 0 }>);

/** Multiple projection with shared path prefix */
expectType<Projected<Foo, { a: 0; 'd.f.g': 0; 'd.f.i': 0 }>>(
  {} as {
    _id: ObjectId;
    b: string;
    c: number;
    d: {
      e: string;
      f: {
        h: string;
      };
    }[];
  },
);

expectType<{
  _id: ObjectId;
  b: string;
  c: number;
  d: {
    e: string;
    f: {
      h: string;
    };
  }[];
}>({} as Projected<Foo, { a: 0; 'd.f.g': 0; 'd.f.i': 0 }>);

/** Inclusion projection with string value */

expectType<Projected<Foo, { a: 1; 'd.f.g': 1; 'd.f.foo': 'yay' }>>(
  {} as {
    _id: ObjectId;
    a: number;
    d: {
      f: {
        foo: 'yay';
        g: string;
      };
    }[];
    ' _ip': never;
  },
);

expectType<{
  _id: ObjectId;
  a: number;
  d: {
    f: {
      extraString: 'yay';
      g: string;
    };
  }[];
  ' _ip': never;
}>(
  {} as Projected<
    Foo,
    {
      a: 1;
      'd.f.g': 1;
      'd.f.extraString': 'yay';
    }
  >,
);

/** Exclusion projection with string value */

// Direct value in an exclusion projection is forbidden.
expectType<Projected<Foo, { a: 0; 'd.f.foo': 'yay' }>>({} as never);
expectType<never>({} as Projected<Foo, { a: 0; 'd.f.foo': 'yay' }>);
