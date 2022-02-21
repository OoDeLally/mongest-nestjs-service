/* eslint-disable @typescript-eslint/no-unused-vars */

import { isEntityInstanceOf } from 'src';
import { expectType } from 'tsd';

class Mother {
  b!: string;
  a!: string;
  c!: string;
}

class Child extends Mother {
  d!: string;
  e!: string;
}

const mother = {} as Mother;

if (isEntityInstanceOf<Mother, Child>(mother, Child)) {
  expectType<Mother & Child>(mother);
}

const motherWhiteList = {} as Pick<Mother, 'a' | 'b'> & { ' _wlp': never; h: unknown };

if (isEntityInstanceOf(motherWhiteList, Child)) {
  expectType<{ a: string; b: string; h: unknown }>(motherWhiteList);

  // @ts-expect-error 'c' is not projected.
  expectType<{ c: string }>(motherWhiteList);
}

const motherBlackList = {} as Omit<Mother, 'a' | 'b'> & { a: undefined; b: undefined };

if (isEntityInstanceOf(motherBlackList, Child)) {
  expectType<Omit<Child, 'a' | 'b'> & { a: undefined; b: undefined }>(motherBlackList);

  // @ts-expect-error 'a' was omitted
  expectType<{ a: string }>(motherBlackList);
}
