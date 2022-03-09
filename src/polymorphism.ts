import { Type } from '@nestjs/common';
import { EntityPayload } from './types';

type OnlyUndefinedFields<Doc extends EntityPayload> = {
  [Key in keyof Doc as Doc[Key] extends undefined ? Key : never]: Doc[Key];
};

type UndefinedFields<Doc extends EntityPayload> = keyof OnlyUndefinedFields<Doc>;

export function isEntityInstanceOf<
  PickedDoc extends EntityPayload,
  OtherClass extends EntityPayload,
>(
  doc: PickedDoc,
  classRef: Type<OtherClass>,
): doc is ' _ip' extends keyof PickedDoc
  ? // Exclusion Projection
    Pick<PickedDoc & OtherClass, keyof PickedDoc>
  : // Inclusion Projection
  OtherClass extends PickedDoc
  ? OtherClass
  : PickedDoc & Omit<OtherClass, UndefinedFields<PickedDoc>>;

export function isEntityInstanceOf(doc: unknown, classRef: Type<unknown>): boolean {
  return doc instanceof classRef;
}
