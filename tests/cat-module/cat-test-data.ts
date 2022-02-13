import { ObjectId } from 'mongodb';
import { OmitId } from 'src/types';
import { HomeCat } from 'tests/home-cat-module/home-cat.entity';
import { StrayCat } from '../stray-cat-module/stray-cat.entity';
import { CatKind } from './cat.entity';

export const pogoCat: OmitId<StrayCat> = {
  kind: CatKind.StrayCat,
  territorySize: 45,
  name: 'Pogo',
  age: 5,
};

export const ortieCat: OmitId<StrayCat> = {
  kind: CatKind.StrayCat,
  territorySize: 80,
  name: 'Ortie',
  age: 6,
};

export const safiCat: OmitId<StrayCat> = {
  kind: CatKind.StrayCat,
  territorySize: 80,
  name: 'Safi',
  age: 3,
};

export const silverCat: OmitId<HomeCat> = {
  kind: CatKind.HomeCat,
  name: 'Silver',
  age: 5,
  humanSlave: 'mom',
};

export const pogoCatMongoDoc: StrayCat = {
  ...pogoCat,
  _id: new ObjectId('111111111111111111111111'),
};

export const ortieCatMongoDoc: StrayCat = {
  ...ortieCat,
  _id: new ObjectId('222222222222222222222222'),
};

export const safiCatMongoDoc: StrayCat = {
  ...safiCat,
  _id: new ObjectId('333333333333333333333333'),
};

export const silverCatMongoDoc: HomeCat = {
  ...silverCat,
  _id: new ObjectId('444444444444444444444444'),
};
