import { Type } from '@nestjs/common';
import { EntityPayload } from './types';

export function isEntityInstanceOf<D extends EntityPayload, C extends D>(
  doc: D,
  classRef: Type<C>,
): doc is C;

export function isEntityInstanceOf<D extends EntityPayload, C extends object>(
  doc: D,
  classRef: Type<C>,
): doc is {
  // We dont extract it to a named type, so that TS resolves the full document in the IDEs.
  [Key in keyof D]: Key extends keyof C ? C[Key] & D[Key] : D[Key];
};

export function isEntityInstanceOf(doc: unknown, classRef: Type<unknown>): boolean {
  return doc instanceof classRef;
}

// type Foo = {
//   _id: ObjectId;
//   name: string;
//   territorySize: unknown;
//   humanSlave: unknown;
// };

// type Bar = EnableFieldsFromQualifiedClass<Foo, StrayCat>;

// const bar = {} as Bar;
// const foo: Foo = bar;
