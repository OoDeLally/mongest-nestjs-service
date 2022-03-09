/* eslint-disable @typescript-eslint/no-unused-vars */

import { isEntityInstanceOf } from 'src';
import { expectType } from 'tsd';

class Mother {
  b!: string;
  a!: string;
  c!: string;
  j!: string;
}

class Child extends Mother {
  d!: string;
  e!: string;
}

const mother = {} as Mother;

if (isEntityInstanceOf<Mother, Child>(mother, Child)) {
  expectType<Mother & Child>(mother);
}

const motherInclusionProjection = {} as Pick<Mother, 'a' | 'b'> & { h: unknown; ' _ip': never };

if (isEntityInstanceOf(motherInclusionProjection, Child)) {
  expectType<{ a: string; b: string; h: unknown }>(motherInclusionProjection);

  // @ts-expect-error 'c' is not projected.
  expectType<{ c: string }>(motherInclusionProjection);
}

const motherExclusionProjection = {} as Omit<Mother, 'a' | 'b'> & {
  ' _ep': never;
  a: undefined;
  b: undefined;
};

if (isEntityInstanceOf(motherExclusionProjection, Child)) {
  expectType<Omit<Child, 'a' | 'b'> & { a: undefined; b: undefined }>(motherExclusionProjection);

  // @ts-expect-error 'a' was omitted
  expectType<{ a: string }>(motherExclusionProjection);
}
