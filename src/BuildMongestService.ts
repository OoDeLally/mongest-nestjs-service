/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
import { Injectable, NotFoundException, Type } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { MongoProjection } from 'mongest-projection';
import { UpdateResult } from 'mongodb';
import { FilterQuery, Model, PipelineStage, UpdateQuery } from 'mongoose';
import {
  CountDocumentsOptions,
  DeleteManyOptions,
  DeleteResult,
  DocOrProjectedDoc,
  FindByIdAndUpdateOptions,
  FindByIdOptions,
  FindOneAndDeleteOptions,
  FindOneAndReplaceOptions,
  FindOneAndUpdateOptions,
  FindOneOptions,
  FindOptions,
  MongestService,
  UpdateManyOptions,
  UpdateOneOptions,
} from './MongestService';
import { paginateQuery } from './pagination';
import { getEntityClassForSchema } from './registerEntityClassForSchema';
import { AbstractType, EntityPayload, ExtractIdType, OmitId } from './types';

export function BuildMongestService<EDoc extends EntityPayload>(
  EntityClass: Type<EDoc>,
): AbstractType<MongestService<EDoc>> {
  type E = OmitId<EDoc>;
  type IdType = ExtractIdType<EDoc>;

  @Injectable()
  abstract class BaseServiceHost implements MongestService<EDoc> {
    protected readonly discriminatorKey: string | null;

    constructor(@InjectModel(EntityClass.name) public model: Model<EDoc>) {
      if (!model) {
        throw Error(
          `MongestService received an ${model} model for ${EntityClass.name}.\n` +
            `\tPossible causes:\n` +
            `\t- Mongoose model is not declared in your module (e.g. MongooseModule.forFeature(...)).\n` +
            `\t- You're overriding the constructor of a MongestService's child class, but you forgot to inject the model and give it to "super(...)".`,
        );
      }
      this.discriminatorKey = this.model.schema.get('discriminatorKey') || null;
    }

    async aggregate<ResultDoc extends object | unknown = unknown>(
      pipeline: PipelineStage[],
    ): Promise<ResultDoc[]> {
      return await this.model.aggregate(pipeline);
    }

    async countDocuments(
      filter?: FilterQuery<EDoc>,
      options?: CountDocumentsOptions,
    ): Promise<number> {
      const query = this.model.countDocuments(filter || {}, options);
      const count = await query.lean().exec();
      return count;
    }

    async deleteMany(
      filter?: FilterQuery<EDoc>,
      options?: DeleteManyOptions,
    ): Promise<DeleteResult> {
      const query = this.model.deleteMany(filter || {});
      return await paginateQuery<any, any>(query, options).lean().exec();
    }

    async deleteOne(filter?: FilterQuery<EDoc>): Promise<DeleteResult> {
      return await this.model
        .deleteOne(filter || {})
        .lean()
        .exec();
    }

    async deleteById(id: IdType): Promise<DeleteResult> {
      return await this.model.deleteOne({ _id: id } as FilterQuery<EDoc>);
    }

    async find<P extends MongoProjection | undefined = undefined>(
      filter?: FilterQuery<EDoc>,
      options?: FindOptions<E, P>,
    ): Promise<DocOrProjectedDoc<EDoc, P>[]> {
      const query = this.model.find(filter || {}, options?.projection, options);
      const docs = await paginateQuery<E>(query, options).lean().exec();
      return docs.map((doc) => this.castToEntityInstance(doc) as DocOrProjectedDoc<EDoc, P>);
    }

    async findOne<P extends MongoProjection | undefined = undefined>(
      filter?: FilterQuery<EDoc>,
      options?: FindOneOptions<E, P>,
    ): Promise<DocOrProjectedDoc<EDoc, P> | null> {
      const query = this.model.findOne(filter || {}, options?.projection);
      const doc = await paginateQuery<any, any>(query, options).lean().exec();
      if (!doc) {
        return null;
      }
      return this.castToEntityInstance(doc);
    }

    async findOneAndDelete<P extends MongoProjection | undefined = undefined>(
      filter?: FilterQuery<EDoc>,
      options?: FindOneAndDeleteOptions<E, P>,
    ): Promise<DocOrProjectedDoc<EDoc, P> | null> {
      const deletedDoc = await this.model.findOneAndDelete(filter, options);
      if (!deletedDoc) {
        return null;
      }
      return this.castToEntityInstance(deletedDoc.toObject());
    }

    findOneAndUpdate<P extends MongoProjection | undefined = undefined>(
      filter: FilterQuery<EDoc>,
      payload: UpdateQuery<E>,
      options: FindOneAndUpdateOptions<E, P> & { new: true; upsert: true },
    ): Promise<DocOrProjectedDoc<EDoc, P>>;
    findOneAndUpdate<P extends MongoProjection | undefined = undefined>(
      filter: FilterQuery<EDoc>,
      payload: UpdateQuery<E>,
      options?: FindOneAndUpdateOptions<E, P>,
    ): Promise<DocOrProjectedDoc<EDoc, P> | null>;

    async findOneAndUpdate<P extends MongoProjection | undefined = undefined>(
      filter: FilterQuery<EDoc>,
      payload: UpdateQuery<E>,
      options?: FindOneAndUpdateOptions<E, P>,
    ): Promise<DocOrProjectedDoc<EDoc, P> | null> {
      const doc = await this.model
        .findOneAndUpdate(filter, payload as UpdateQuery<E>, {
          ...options,
          overwriteDiscriminatorKey: true,
        })
        .lean()
        .exec();
      if (!doc) {
        return null;
      }
      return this.castToEntityInstance(doc);
    }

    async findById<P extends MongoProjection | undefined = undefined>(
      id: IdType,
      options?: FindByIdOptions<P>,
    ): Promise<DocOrProjectedDoc<EDoc, P> | null> {
      const doc = await this.model.findById(id, options?.projection).lean().exec();
      if (!doc) {
        return null;
      }
      return this.castToEntityInstance(doc);
    }

    async findByIdOrThrow<P extends MongoProjection | undefined = undefined>(
      id: IdType,
      options?: FindByIdOptions<P>,
    ): Promise<DocOrProjectedDoc<EDoc, P>> {
      const doc = await this.findById(id, options);
      if (!doc) {
        throw new NotFoundException(`Doc ${this.model.modelName} ${id} not found`);
      }
      return doc;
    }

    findByIdAndUpdate<P extends MongoProjection | undefined = undefined>(
      id: IdType,
      payload: UpdateQuery<E>,
      options: FindByIdAndUpdateOptions<P> & { new: true; upsert: true },
    ): Promise<DocOrProjectedDoc<EDoc, P>>;
    findByIdAndUpdate<P extends MongoProjection | undefined = undefined>(
      id: IdType,
      payload: UpdateQuery<E>,
      options?: FindByIdAndUpdateOptions<P> & ({ new?: false } | { upsert?: false }),
    ): Promise<DocOrProjectedDoc<EDoc, P> | null>;

    async findByIdAndUpdate<P extends MongoProjection | undefined = undefined>(
      id: IdType,
      payload: UpdateQuery<E>,
      options?: FindByIdAndUpdateOptions<P>,
    ): Promise<DocOrProjectedDoc<EDoc, P> | null> {
      const doc = await this.findOneAndUpdate({ _id: id } as FilterQuery<EDoc>, payload, options);
      if (!doc) {
        return null;
      }
      return this.castToEntityInstance(doc);
    }

    async findByIdAndDelete<P extends MongoProjection | undefined = undefined>(
      id: IdType,
    ): Promise<DocOrProjectedDoc<EDoc, P> | null> {
      const deletedDoc = await this.model.findByIdAndDelete(id);
      if (!deletedDoc) {
        return null;
      }
      return this.castToEntityInstance(deletedDoc.toObject());
    }

    findOneAndReplace<P extends MongoProjection | undefined = undefined>(
      filter?: FilterQuery<EDoc>,
      replacement?: E,
      options?: FindOneAndReplaceOptions<E, P> & { new: true; upsert: true },
    ): Promise<DocOrProjectedDoc<EDoc, P>>;
    findOneAndReplace<P extends MongoProjection | undefined = undefined>(
      filter?: FilterQuery<EDoc>,
      replacement?: E,
      options?: FindOneAndReplaceOptions<E, P>,
    ): Promise<DocOrProjectedDoc<EDoc, P> | null>;
    async findOneAndReplace<P extends MongoProjection | undefined = undefined>(
      filter?: FilterQuery<EDoc>,
      replacement?: E,
      options?: FindOneAndReplaceOptions<E, P>,
    ): Promise<DocOrProjectedDoc<EDoc, P> | null> {
      const doc = await this.model.findOneAndReplace(filter, replacement, options);
      if (!doc) {
        return null;
      }
      return this.castToEntityInstance(doc.toObject());
    }

    async insert(payload: Partial<E>): Promise<EDoc> {
      const doc = await this.model.create(payload);
      return this.castToEntityInstance(doc.toObject());
    }

    async insertMany(payloads: Partial<E>[]): Promise<EDoc[]> {
      const createdDocs = await this.model.insertMany(payloads);
      return createdDocs.map((doc) => this.castToEntityInstance(doc.toObject()));
    }

    async updateMany(
      filter: FilterQuery<EDoc>,
      updateQuery: UpdateQuery<E>,
      options?: UpdateManyOptions,
    ): Promise<UpdateResult> {
      return await this.model.updateMany(filter, updateQuery, options);
    }

    async updateOne(
      filter: FilterQuery<EDoc>,
      updateQuery: UpdateQuery<E>,
      options?: UpdateOneOptions,
    ): Promise<UpdateResult> {
      return await this.model.updateOne(filter, updateQuery, options);
    }

    async updateById(
      id: IdType,
      updateQuery: UpdateQuery<E>,
      options?: UpdateOneOptions,
    ): Promise<UpdateResult> {
      const res = await this.updateOne({ _id: id } as FilterQuery<EDoc>, updateQuery, options);
      return res;
    }

    private castToEntityInstance(doc: any): any {
      const discriminators = this.model.discriminators;
      if (!discriminators || !this.discriminatorKey) {
        return Object.assign(new EntityClass(), doc);
      }
      const discriminatorValue = (doc as any)[this.discriminatorKey];
      if (typeof discriminatorValue !== 'string') {
        throw Error(
          `${this.model.name} doc ${doc._id} is missing a "${this.discriminatorKey}" discriminator value`,
        );
      }
      const model = discriminators[discriminatorValue];
      if (!model) {
        throw Error(
          `${this.model.name} doc ${doc._id} has a "${
            this.discriminatorKey
          }" discriminator with unsupported value "${discriminatorValue}". Supported values are ${Object.keys(
            discriminators,
          ).join(', ')}.`,
        );
      }
      const ChildEntityClass = getEntityClassForSchema(model.schema);
      if (!ChildEntityClass) {
        throw Error(
          `Document class was not found for schema of model "${model.modelName}".\nDid you forget to call registerEntityClassForSchema(${model.modelName}, ${model.modelName}Schema)?`,
        );
      }
      return Object.assign(new ChildEntityClass(), doc);
    }
  }
  return BaseServiceHost;
}
