import { ObjectId } from 'mongodb';

export type EntityPayload = object;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AbstractType<T = any> = abstract new (...args: any[]) => T;

export type MongoDoc<T, ID = ObjectId> = T & { _id: ID };
