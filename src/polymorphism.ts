import { Type } from '@nestjs/common';
import { MongoDoc } from './types';

export function isEntityInstanceOf<D extends object, C extends D>(
  doc: MongoDoc<D>,
  classRef: Type<C>,
): doc is MongoDoc<C>;

export function isEntityInstanceOf<D extends object, C extends object>(
  doc: D,
  classRef: Type<C>,
): doc is {
  // We dont extract it to a named type, so that TS resolves the full document in the IDEs.
  [Key in '_id' | keyof D | keyof D]: Key extends keyof D
    ? Key extends keyof C
      ? C[Key] & D[Key]
      : D[Key]
    : never;
};

export function isEntityInstanceOf<D extends object, C extends object>(
  doc: D,
  classRef: Type<C>,
): boolean {
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
