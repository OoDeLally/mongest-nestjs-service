import { ExclusionProjected } from './exclusion-projection';
import {
  InclusionProjected,
  IsInclusionProjection,
  ResolveProjectionReference,
} from './inclusion-projection';
import { EntityPayload, MongoProjection } from './types';

export type Projected<
  D extends EntityPayload,
  P extends MongoProjection,
> = IsInclusionProjection<P> extends never
  ? never // invalid projection e.g. {a: 1, b: 0}
  : IsInclusionProjection<P> extends true
  ? InclusionProjected<D, P, ResolveProjectionReference<D, P>, true>
  : IsInclusionProjection<P> extends false
  ? ExclusionProjected<D, P, true>
  : never; // invalid projection (not sure whether that can happen)
