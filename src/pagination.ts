import { SortDirection } from 'mongodb';
import { Query } from 'mongoose';
import { EntityPayload } from './types';

export type SortObject<T extends EntityPayload> = Partial<Record<keyof T, SortDirection>>;

export interface FindManyDocsPaginationArgs<T extends EntityPayload> {
  limit?: number;
  skip?: number;
  sort?: SortObject<T>;
}

export const paginateQuery = <
  DocType extends EntityPayload,
  QueryType extends Query<DocType[], DocType> = Query<DocType[], DocType>,
>(
  query: QueryType,
  pagination: FindManyDocsPaginationArgs<DocType> | undefined,
): QueryType => {
  if (pagination?.skip) {
    query = query.skip(pagination.skip);
  }
  if (pagination?.limit) {
    query = query.limit(pagination.limit);
  }
  if (pagination?.sort) {
    query = query.sort(pagination.sort);
  }
  return query;
};
