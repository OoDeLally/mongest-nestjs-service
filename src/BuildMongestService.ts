/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
import { Injectable, NotFoundException, Type } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ObjectId, UpdateResult } from 'mongodb';
import { FilterQuery, Model, PipelineStage, UpdateQuery } from 'mongoose';
import { AbstractType, EntityPayload, MongoDoc } from 'src/types';
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
import { MongoProjection } from './projection';
import { getEntityClassForSchema } from './registerEntityClassForSchema';

export function BuildMongestService<T extends EntityPayload, IdType = ObjectId>(
  EntityClass: Type<T>,
): AbstractType<MongestService<T, IdType>> {
  @Injectable()
  abstract class BaseServiceHost implements MongestService<T, IdType> {
    protected readonly discriminatorKey: string | null;

    constructor(@InjectModel(EntityClass.name) public model: Model<T>) {
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
      filter?: FilterQuery<MongoDoc<T, IdType>>,
      options?: CountDocumentsOptions,
    ): Promise<number> {
      const query = this.model.countDocuments(filter || {}, options);
      const count = await query.lean().exec();
      return count;
    }

    async deleteMany(
      filter?: FilterQuery<MongoDoc<T, IdType>>,
      options?: DeleteManyOptions,
    ): Promise<DeleteResult> {
      const query = this.model.deleteMany(filter || {});
      return await paginateQuery<any, any>(query, options).lean().exec();
    }

    async deleteOne(filter?: FilterQuery<MongoDoc<T, IdType>>): Promise<DeleteResult> {
      return await this.model
        .deleteOne(filter || {})
        .lean()
        .exec();
    }

    async deleteById(id: IdType): Promise<DeleteResult> {
      return await this.model.deleteOne({ _id: id } as FilterQuery<MongoDoc<T, IdType>>);
    }

    async find<P extends MongoProjection | undefined = undefined>(
      filter?: FilterQuery<MongoDoc<T, IdType>>,
      options?: FindOptions<T, P>,
    ): Promise<DocOrProjectedDoc<MongoDoc<T, IdType>, P>[]> {
      const query = this.model.find(filter || {}, options?.projection, options);
      const docs = await paginateQuery<T>(query, options).lean().exec();
      return docs.map(
        (doc) => this.castToEntityInstance(doc) as DocOrProjectedDoc<MongoDoc<T, IdType>, P>,
      );
    }

    async findOne<P extends MongoProjection | undefined = undefined>(
      filter?: FilterQuery<MongoDoc<T, IdType>>,
      options?: FindOneOptions<T, P>,
    ): Promise<DocOrProjectedDoc<MongoDoc<T, IdType>, P> | null> {
      const query = this.model.findOne(filter || {}, options?.projection);
      const doc = await paginateQuery<any, any>(query, options).lean().exec();
      if (!doc) {
        return null;
      }
      return this.castToEntityInstance(doc);
    }

    async findOneAndDelete<P extends MongoProjection | undefined = undefined>(
      filter?: FilterQuery<MongoDoc<T, IdType>>,
      options?: FindOneAndDeleteOptions<T, P>,
    ): Promise<DocOrProjectedDoc<MongoDoc<T, IdType>, P> | null> {
      const deletedDoc = await this.model.findOneAndDelete(filter, options);
      if (!deletedDoc) {
        return null;
      }
      return this.castToEntityInstance(deletedDoc.toObject());
    }

    findOneAndUpdate<P extends MongoProjection | undefined = undefined>(
      filter: FilterQuery<MongoDoc<T, IdType>>,
      payload: UpdateQuery<T>,
      options: FindOneAndUpdateOptions<T, P> & { new: true; upsert: true },
    ): Promise<DocOrProjectedDoc<MongoDoc<T, IdType>, P>>;
    findOneAndUpdate<P extends MongoProjection | undefined = undefined>(
      filter: FilterQuery<MongoDoc<T, IdType>>,
      payload: UpdateQuery<T>,
      options?: FindOneAndUpdateOptions<T, P>,
    ): Promise<DocOrProjectedDoc<MongoDoc<T, IdType>, P> | null>;

    async findOneAndUpdate<P extends MongoProjection | undefined = undefined>(
      filter: FilterQuery<MongoDoc<T, IdType>>,
      payload: UpdateQuery<T>,
      options?: FindOneAndUpdateOptions<T, P>,
    ): Promise<DocOrProjectedDoc<MongoDoc<T, IdType>, P> | null> {
      const doc = await this.model
        .findOneAndUpdate(filter, payload as UpdateQuery<T>, {
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
    ): Promise<DocOrProjectedDoc<MongoDoc<T, IdType>, P> | null> {
      const doc = await this.model.findById(id, options?.projection).lean().exec();
      if (!doc) {
        return null;
      }
      return this.castToEntityInstance(doc);
    }

    async findByIdOrThrow<P extends MongoProjection | undefined = undefined>(
      id: IdType,
      options?: FindByIdOptions<P>,
    ): Promise<DocOrProjectedDoc<MongoDoc<T, IdType>, P>> {
      const doc = await this.findById(id, options);
      if (!doc) {
        throw new NotFoundException(`Doc ${this.model.modelName} ${id} not found`);
      }
      return doc;
    }

    findByIdAndUpdate<P extends MongoProjection | undefined = undefined>(
      id: IdType,
      payload: UpdateQuery<T>,
      options: FindByIdAndUpdateOptions<P> & { new: true; upsert: true },
    ): Promise<DocOrProjectedDoc<MongoDoc<T, IdType>, P>>;
    findByIdAndUpdate<P extends MongoProjection | undefined = undefined>(
      id: IdType,
      payload: UpdateQuery<T>,
      options?: FindByIdAndUpdateOptions<P> & ({ new?: false } | { upsert?: false }),
    ): Promise<DocOrProjectedDoc<MongoDoc<T, IdType>, P> | null>;

    async findByIdAndUpdate<P extends MongoProjection | undefined = undefined>(
      id: IdType,
      payload: UpdateQuery<T>,
      options?: FindByIdAndUpdateOptions<P>,
    ): Promise<DocOrProjectedDoc<MongoDoc<T, IdType>, P> | null> {
      const doc = await this.findOneAndUpdate(
        { _id: id } as FilterQuery<MongoDoc<T, IdType>>,
        payload,
        options,
      );
      if (!doc) {
        return null;
      }
      return this.castToEntityInstance(doc);
    }

    async findByIdAndDelete<P extends MongoProjection | undefined = undefined>(
      id: IdType,
    ): Promise<DocOrProjectedDoc<MongoDoc<T, IdType>, P> | null> {
      const deletedDoc = await this.model.findByIdAndDelete(id);
      if (!deletedDoc) {
        return null;
      }
      return this.castToEntityInstance(deletedDoc.toObject());
    }

    findOneAndReplace<P extends MongoProjection | undefined = undefined>(
      filter?: FilterQuery<MongoDoc<T, IdType>>,
      replacement?: T,
      options?: FindOneAndReplaceOptions<T, P> & { new: true; upsert: true },
    ): Promise<DocOrProjectedDoc<MongoDoc<T, IdType>, P>>;
    findOneAndReplace<P extends MongoProjection | undefined = undefined>(
      filter?: FilterQuery<MongoDoc<T, IdType>>,
      replacement?: T,
      options?: FindOneAndReplaceOptions<T, P>,
    ): Promise<DocOrProjectedDoc<MongoDoc<T, IdType>, P> | null>;
    async findOneAndReplace<P extends MongoProjection | undefined = undefined>(
      filter?: FilterQuery<MongoDoc<T, IdType>>,
      replacement?: T,
      options?: FindOneAndReplaceOptions<T, P>,
    ): Promise<DocOrProjectedDoc<MongoDoc<T, IdType>, P> | null> {
      const doc = await this.model.findOneAndReplace(filter, replacement, options);
      if (!doc) {
        return null;
      }
      return this.castToEntityInstance(doc.toObject());
    }

    async insert(payload: Partial<T>): Promise<MongoDoc<T, IdType>> {
      const doc = await this.model.create(payload);
      return this.castToEntityInstance(doc.toObject());
    }

    async insertMany(payloads: Partial<T>[]): Promise<MongoDoc<T, IdType>[]> {
      const createdDocs = await this.model.insertMany(payloads);
      return createdDocs.map((doc) => this.castToEntityInstance(doc.toObject()));
    }

    async updateMany(
      filter: FilterQuery<MongoDoc<T, IdType>>,
      updateQuery: UpdateQuery<T>,
      options?: UpdateManyOptions,
    ): Promise<UpdateResult> {
      return await this.model.updateMany(filter, updateQuery, options);
    }

    async updateOne(
      filter: FilterQuery<MongoDoc<T, IdType>>,
      updateQuery: UpdateQuery<T>,
      options?: UpdateOneOptions,
    ): Promise<UpdateResult> {
      return await this.model.updateOne(filter, updateQuery, options);
    }

    async updateById(
      id: IdType,
      updateQuery: UpdateQuery<T>,
      options?: UpdateOneOptions,
    ): Promise<UpdateResult> {
      const res = await this.updateOne(
        { _id: id } as FilterQuery<MongoDoc<T, IdType>>,
        updateQuery,
        options,
      );
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
