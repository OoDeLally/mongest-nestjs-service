import { MongoProjection, Projected } from 'mongest-projection';
import { UpdateResult } from 'mongodb';
import { FilterQuery, Model, PipelineStage, UpdateQuery } from 'mongoose';
import { SortObject } from './pagination';
import { EntityPayload, ExtractIdType, OmitId } from './types';

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
  EntityDoc extends EntityPayload,
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

export interface MongestService<EDoc extends EntityPayload> {
  model: Model<EDoc>;

  aggregate<ResultDoc extends object | unknown = unknown>(
    pipeline: PipelineStage[],
  ): Promise<ResultDoc[]>;

  countDocuments(filter?: FilterQuery<EDoc>, options?: CountDocumentsOptions): Promise<number>;

  deleteMany(filter?: FilterQuery<EDoc>, options?: DeleteManyOptions): Promise<DeleteResult>;

  deleteOne(filter?: FilterQuery<EDoc>): Promise<DeleteResult>;

  deleteById(id: ExtractIdType<EDoc>): Promise<DeleteResult>;

  find<P extends MongoProjection | undefined = undefined>(
    filter?: FilterQuery<EDoc>,
    options?: FindOptions<EDoc, P>,
  ): Promise<DocOrProjectedDoc<EDoc, P>[]>;

  findOne<P extends MongoProjection | undefined = undefined>(
    filter?: FilterQuery<EDoc>,
    options?: FindOneOptions<EDoc, P>,
  ): Promise<DocOrProjectedDoc<EDoc, P> | null>;

  findOneAndUpdate<P extends MongoProjection | undefined = undefined>(
    filter: FilterQuery<EDoc>,
    payload: UpdateQuery<OmitId<EDoc>>,
    options: FindOneAndUpdateOptions<EDoc, P> & { new: true; upsert: true },
  ): Promise<DocOrProjectedDoc<EDoc, P>>;
  findOneAndUpdate<P extends MongoProjection | undefined = undefined>(
    filter: FilterQuery<EDoc>,
    payload: UpdateQuery<OmitId<EDoc>>,
    options?: FindOneAndUpdateOptions<EDoc, P> & ({ new?: false } | { upsert?: false }),
  ): Promise<DocOrProjectedDoc<EDoc, P> | null>;

  findById<P extends MongoProjection | undefined = undefined>(
    id: ExtractIdType<EDoc>,
    options?: FindByIdOptions<P>,
  ): Promise<DocOrProjectedDoc<EDoc, P> | null>;

  findByIdOrThrow<P extends MongoProjection | undefined = undefined>(
    id: ExtractIdType<EDoc>,
    options?: FindByIdOptions<P>,
  ): Promise<DocOrProjectedDoc<EDoc, P>>;

  findByIdAndUpdate<P extends MongoProjection | undefined = undefined>(
    id: ExtractIdType<EDoc>,
    payload: UpdateQuery<OmitId<EDoc>>,
    options: FindByIdAndUpdateOptions<P> & { new: true; upsert: true },
  ): Promise<DocOrProjectedDoc<EDoc, P>>;
  findByIdAndUpdate<P extends MongoProjection | undefined = undefined>(
    id: ExtractIdType<EDoc>,
    payload: UpdateQuery<OmitId<EDoc>>,
    options?: FindByIdAndUpdateOptions<P>,
  ): Promise<DocOrProjectedDoc<EDoc, P> | null>;

  findByIdAndDelete<P extends MongoProjection | undefined = undefined>(
    id: ExtractIdType<EDoc>,
  ): Promise<DocOrProjectedDoc<EDoc, P> | null>;

  findOneAndDelete<P extends MongoProjection | undefined = undefined>(
    filter: FilterQuery<EDoc>,
    options?: FindOneAndDeleteOptions<EDoc, P>,
  ): Promise<DocOrProjectedDoc<EDoc, P> | null>;

  findOneAndReplace<P extends MongoProjection | undefined = undefined>(
    filter: FilterQuery<EDoc>,
    replacement: OmitId<EDoc>,
    options: FindOneAndReplaceOptions<EDoc, P> & { new: true; upsert: true },
  ): Promise<DocOrProjectedDoc<EDoc, P>>;
  findOneAndReplace<P extends MongoProjection | undefined = undefined>(
    filter: FilterQuery<EDoc>,
    replacement: OmitId<EDoc>,
    options?: FindOneAndReplaceOptions<EDoc, P> & ({ new?: false } | { upsert?: false }),
  ): Promise<DocOrProjectedDoc<EDoc, P> | null>;

  insert(payload: Partial<EDoc>): Promise<EDoc>;

  insertMany(payloads: Partial<EDoc>[]): Promise<EDoc[]>;

  updateMany(
    filter: FilterQuery<EDoc>,
    payload: UpdateQuery<OmitId<EDoc>>,
    options?: UpdateManyOptions,
  ): Promise<UpdateResult>;

  updateOne(
    filter: FilterQuery<EDoc>,
    payload: UpdateQuery<OmitId<EDoc>>,
    options?: UpdateOneOptions,
  ): Promise<UpdateResult>;

  updateById(
    id: ExtractIdType<EDoc>,
    updateQuery: UpdateQuery<OmitId<EDoc>>,
    options?: UpdateOneOptions,
  ): Promise<UpdateResult>;
}
