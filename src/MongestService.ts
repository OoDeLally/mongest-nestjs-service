import { ObjectId, UpdateResult } from 'mongodb';
import { FilterQuery, Model, PipelineStage, UpdateQuery } from 'mongoose';
import { SortObject } from './pagination';
import { MongoProjection, Projected } from './projection';
import { EntityPayload, MongoDoc } from './types';

export type CountDocumentsOptions = {
  skip?: number;
  limit?: number;
};

export type FindOptions<T extends EntityPayload, P extends MongoProjection | undefined> = {
  skip?: number;
  limit?: number;
  sort?: SortObject<T>;
  projection?: P;
};

export type DocOrProjectedDoc<
  EntityDoc extends MongoDoc<EntityPayload, unknown>,
  P extends MongoProjection | undefined,
> = P extends MongoProjection ? Projected<EntityDoc, P> : EntityDoc;

export type FindOneOptions<T extends EntityPayload, P extends MongoProjection | undefined> = {
  skip?: number;
  sort?: SortObject<T>;
  projection?: P;
};

export type FindOneAndDeleteOptions<
  T extends EntityPayload,
  P extends MongoProjection | undefined,
> = {
  sort?: SortObject<T>;
  projection?: P;
};

export type FindByIdOptions<P extends MongoProjection | undefined> = {
  projection?: P;
};

export type DeleteManyOptions = {
  limit?: 1; // If set, makes the query equivalent to deleteOne().
};

export type UpdateOneOptions = {
  upsert?: boolean;
};

export type UpdateManyOptions = {
  upsert?: boolean;
};

export type FindOneAndUpdateOptions<
  T extends EntityPayload,
  P extends MongoProjection | undefined,
> = {
  sort?: SortObject<T>;
  projection?: P;
  new?: boolean;
  upsert?: boolean;
};

export type FindOneAndReplaceOptions<
  T extends EntityPayload,
  P extends MongoProjection | undefined,
> = FindOneAndUpdateOptions<T, P>;

export type FindByIdAndUpdateOptions<P extends MongoProjection | undefined> = {
  projection?: P;
  new?: boolean;
  upsert?: boolean;
};

export type DeleteResult = { deletedCount: number };

export interface MongestService<T extends EntityPayload, IdType = ObjectId> {
  model: Model<T>;

  aggregate<ResultDoc extends object | unknown = unknown>(
    pipeline: PipelineStage[],
  ): Promise<ResultDoc[]>;

  countDocuments(
    filter?: FilterQuery<MongoDoc<T, IdType>>,
    options?: CountDocumentsOptions,
  ): Promise<number>;

  deleteMany(
    filter?: FilterQuery<MongoDoc<T, IdType>>,
    options?: DeleteManyOptions,
  ): Promise<DeleteResult>;

  deleteOne(filter?: FilterQuery<MongoDoc<T, IdType>>): Promise<DeleteResult>;

  deleteById(id: IdType): Promise<DeleteResult>;

  find<P extends MongoProjection | undefined = undefined>(
    filter?: FilterQuery<MongoDoc<T, IdType>>,
    options?: FindOptions<T, P>,
  ): Promise<DocOrProjectedDoc<MongoDoc<T, IdType>, P>[]>;

  findOne<P extends MongoProjection | undefined = undefined>(
    filter?: FilterQuery<MongoDoc<T, IdType>>,
    options?: FindOneOptions<T, P>,
  ): Promise<DocOrProjectedDoc<MongoDoc<T, IdType>, P> | null>;

  findOneAndUpdate<P extends MongoProjection | undefined = undefined>(
    filter: FilterQuery<MongoDoc<T, IdType>>,
    payload: UpdateQuery<T>,
    options: FindOneAndUpdateOptions<T, P> & { new: true; upsert: true },
  ): Promise<DocOrProjectedDoc<MongoDoc<T, IdType>, P>>;
  findOneAndUpdate<P extends MongoProjection | undefined = undefined>(
    filter: FilterQuery<MongoDoc<T, IdType>>,
    payload: UpdateQuery<T>,
    options?: FindOneAndUpdateOptions<T, P> & ({ new?: false } | { upsert?: false }),
  ): Promise<DocOrProjectedDoc<MongoDoc<T, IdType>, P> | null>;

  findById<P extends MongoProjection | undefined = undefined>(
    id: IdType,
    options?: FindByIdOptions<P>,
  ): Promise<DocOrProjectedDoc<MongoDoc<T, IdType>, P> | null>;

  findByIdOrThrow<P extends MongoProjection | undefined = undefined>(
    id: IdType,
    options?: FindByIdOptions<P>,
  ): Promise<DocOrProjectedDoc<MongoDoc<T, IdType>, P>>;

  findByIdAndUpdate<P extends MongoProjection | undefined = undefined>(
    id: IdType,
    payload: UpdateQuery<T>,
    options: FindByIdAndUpdateOptions<P> & { new: true; upsert: true },
  ): Promise<DocOrProjectedDoc<MongoDoc<T, IdType>, P>>;
  findByIdAndUpdate<P extends MongoProjection | undefined = undefined>(
    id: IdType,
    payload: UpdateQuery<T>,
    options?: FindByIdAndUpdateOptions<P>,
  ): Promise<DocOrProjectedDoc<MongoDoc<T, IdType>, P> | null>;

  findByIdAndDelete<P extends MongoProjection | undefined = undefined>(
    id: IdType,
  ): Promise<DocOrProjectedDoc<MongoDoc<T, IdType>, P> | null>;

  findOneAndDelete<P extends MongoProjection | undefined = undefined>(
    filter: FilterQuery<MongoDoc<T, IdType>>,
    options?: FindOneAndDeleteOptions<T, P>,
  ): Promise<DocOrProjectedDoc<MongoDoc<T, IdType>, P> | null>;

  findOneAndReplace<P extends MongoProjection | undefined = undefined>(
    filter: FilterQuery<MongoDoc<T, IdType>>,
    replacement: T,
    options: FindOneAndReplaceOptions<T, P> & { new: true; upsert: true },
  ): Promise<DocOrProjectedDoc<MongoDoc<T, IdType>, P>>;
  findOneAndReplace<P extends MongoProjection | undefined = undefined>(
    filter: FilterQuery<MongoDoc<T, IdType>>,
    replacement: T,
    options?: FindOneAndReplaceOptions<T, P> & ({ new?: false } | { upsert?: false }),
  ): Promise<DocOrProjectedDoc<MongoDoc<T, IdType>, P> | null>;

  insert(payload: Partial<T>): Promise<MongoDoc<T, IdType>>;

  insertMany(payloads: Partial<T>[]): Promise<MongoDoc<T, IdType>[]>;

  updateMany(
    filter: FilterQuery<MongoDoc<T, IdType>>,
    payload: UpdateQuery<T>,
    options?: UpdateManyOptions,
  ): Promise<UpdateResult>;

  updateOne(
    filter: FilterQuery<MongoDoc<T, IdType>>,
    payload: UpdateQuery<T>,
    options?: UpdateOneOptions,
  ): Promise<UpdateResult>;

  updateById(
    id: IdType,
    updateQuery: UpdateQuery<T>,
    options?: UpdateOneOptions,
  ): Promise<UpdateResult>;
}
