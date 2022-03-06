import { EntityPayload } from './types';

export type PickAndUnwrapIfMatchRootKey<Proj extends object, RootKey extends string> = {
  [Key in keyof Proj as Key extends `${RootKey}.${infer ChildKey}` ? ChildKey : never]: Proj[Key];
};

export type GetEntityValueTypeOrUnknown<D extends EntityPayload, K> = K extends keyof D
  ? D[K]
  : unknown;
