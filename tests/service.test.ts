import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { ObjectId } from 'mongodb';
import { Document as MongooseDocument } from 'mongoose';
import { isEntityInstanceOf } from '../src/polymorphism';
import { ortieCat, pogoCat, safiCat, silverCat } from './cat-module/cat-test-data';
import { CatModule } from './cat-module/cat.module';
import { CatsService } from './cat-module/cat.service';
import { databaseModule, MongodInstance } from './database.module';
import { HomeCat } from './home-cat-module/home-cat.entity';
import { StrayCat } from './stray-cat-module/stray-cat.entity';

chai.use(chaiAsPromised);

describe('CatsService', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;
  let catService: CatsService;

  before(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [databaseModule, CatModule],
    }).compile();
    app = moduleRef.createNestApplication();
    catService = moduleRef.get<CatsService>(CatsService);
    await app.init();
    await app.listen(1234);
  });
  after(async () => {
    await MongodInstance.stop();
    await app.close();
  });
  beforeEach(async function () {
    await catService.deleteMany();
  });

  it('should insertOne cats', async function () {
    await catService.insert(ortieCat);
    await catService.insert(silverCat);
    const cats = await catService.find({}, { sort: { name: 1 } });
    // expect(cats[0]).not.be.instanceOf(MongooseDocument);
    // expect(cats[0]).to.be.instanceOf(Cat);
    expect(cats[0]).to.be.instanceOf(StrayCat);
    expect(cats[0]).to.contain(ortieCat);
    // expect(cats[1]).not.be.instanceOf(MongooseDocument);
    // expect(cats[1]).to.be.instanceOf(Cat);
    expect(cats[1]).to.be.instanceOf(HomeCat);
    expect(cats[1]).to.contain(silverCat);
  });

  it('should insertMany cats', async function () {
    const insertedCats = await catService.insertMany([pogoCat, safiCat, ortieCat]);
    expect(insertedCats).to.be.of.length(3);
    expect(insertedCats[0]).not.be.instanceOf(MongooseDocument);
    expect(insertedCats[0]).to.be.instanceOf(StrayCat);
  });

  it('should aggregate cats', async function () {
    await catService.insertMany([pogoCat, safiCat, ortieCat]);
    const cats = await catService.aggregate<StrayCat>([
      { $match: { name: /o/i } },
      { $sort: { name: 1 } },
    ]);
    expect(cats[0]).to.contain(ortieCat);
    expect(cats[1]).to.contain(pogoCat);
  });

  it('should Find cats by name with projections and skip and limit', async function () {
    await catService.insertMany([pogoCat, safiCat, ortieCat, silverCat]);
    const projectedCats = await catService.find(
      { name: /[ol]/i },
      {
        projection: { name: 1, territorySize: 1, humanSlave: 1 } as const,
        skip: 1,
        limit: 2,
        sort: { name: 1 },
      },
    );
    expect(projectedCats).to.be.of.length(2);
    const firstCat = projectedCats[0]!;
    expect(firstCat).not.be.instanceOf(MongooseDocument);
    expect(firstCat).to.be.instanceOf(StrayCat);
    if (isEntityInstanceOf(firstCat, StrayCat)) {
      expect(firstCat.territorySize).equal(pogoCat.territorySize);
      // @ts-expect-error kind is not projected
      firstCat.kind;
      // @ts-expect-error enemyCount is not projected
      firstCat.enemyCount;
      // @ts-expect-error humanSlave should be unknown
      const _humanSlave: string = firstCat.humanSlave;
    }
    expect(firstCat?.name).to.equal(pogoCat.name);
    expect(firstCat).to.have.haveOwnProperty('_id');
    expect(firstCat).to.not.have.haveOwnProperty('age');
    const secondCat = projectedCats[1]!;
    expect(secondCat.name).to.equal(silverCat.name);
    expect(secondCat).to.be.instanceOf(HomeCat);
    if (isEntityInstanceOf(secondCat, HomeCat)) {
      expect(secondCat.humanSlave).equal(silverCat.humanSlave);
    }
  });

  it('should Find cats by name without projections and skip and limit', async function () {
    await catService.insertMany([pogoCat, safiCat, ortieCat, silverCat]);
    const fullCats = await catService.find(
      { name: /[ol]/i },
      {
        skip: 1,
        limit: 2,
        sort: { name: 1 },
      },
    );
    expect(fullCats).to.be.of.length(2);
    const firstCat = fullCats[0]!;
    expect(firstCat).not.be.instanceOf(MongooseDocument);
    expect(firstCat).to.be.instanceOf(StrayCat);
    if (isEntityInstanceOf(firstCat, StrayCat)) {
      expect(firstCat.territorySize).equal(pogoCat.territorySize);
    }
    expect(firstCat?.name).to.equal(pogoCat.name);
    expect(firstCat).to.have.haveOwnProperty('_id');
    const secondCat = fullCats[1]!;
    expect(secondCat.name).to.equal(silverCat.name);
    expect(secondCat).to.be.instanceOf(HomeCat);
    if (isEntityInstanceOf(secondCat, HomeCat)) {
      expect(secondCat.humanSlave).equal(silverCat.humanSlave);
    }
  });

  it('should count cats', async function () {
    await catService.insertMany([pogoCat, safiCat, ortieCat]);
    const count = await catService.countDocuments({ name: /o/i });
    expect(count).to.equal(2);
  });

  it('should findOne cat', async function () {
    await catService.insertMany([pogoCat, safiCat, ortieCat]);
    const cat = await catService.findOne({ name: /o/i }, {
      projection: { name: 1 } as const,
      skip: 1,
      sort: { name: 1 },
    } as const);
    expect(cat).to.be.an('object');
    expect(cat).to.be.instanceOf(StrayCat);
    expect(cat).not.be.instanceOf(MongooseDocument);
    expect(cat?.name).to.equal(pogoCat.name);
  });

  it('should findById cat', async function () {
    await catService.insert(pogoCat);
    await catService.insert(ortieCat);
    const { _id } = await catService.insert(safiCat);
    expect(_id).to.be.an('object');
    const cat = await catService.findById(_id);
    expect(cat).to.be.an('object');
    expect(cat).not.be.instanceOf(MongooseDocument);
    expect(cat).to.be.instanceOf(StrayCat);
    expect(cat?._id.toHexString()).to.equal(_id.toHexString());
    expect(cat?.name).to.equal(safiCat.name);
    const inexistantCat = await catService.findById(new ObjectId());
    expect(inexistantCat).to.be.null;
  });

  it('should findByIdOrThrow cat', async function () {
    await catService.insert(pogoCat);
    await catService.insert(ortieCat);
    const { _id } = await catService.insert(safiCat);
    expect(_id).to.be.an('object');
    const cat = await catService.findByIdOrThrow(_id);
    expect(cat).to.be.an('object');
    expect(cat).not.be.instanceOf(MongooseDocument);
    expect(cat).to.be.instanceOf(StrayCat);
    expect(cat._id.toHexString()).to.equal(_id.toHexString());
    expect(cat.name).to.equal(safiCat.name);
    await expect(catService.findByIdOrThrow(new ObjectId())).to.be.rejected;
  });

  it('should updateOne and updateById cat', async function () {
    const pogoDoc = await catService.insert(pogoCat);
    await catService.insert(safiCat);
    await catService.insert(ortieCat);
    const pogoNewName = 'Poguette';
    const updateOneResult = await catService.updateOne({ name: /o/i }, { name: pogoNewName });
    expect(updateOneResult.modifiedCount).to.equal(1);
    const cats = await catService.find({}, { sort: { name: 1 } });
    expect(cats).to.be.of.length(3);
    expect(cats[0]).to.be.instanceOf(StrayCat);
    expect(cats[0]?.name).to.equal(ortieCat.name);
    expect(cats[1]?.name).to.equal(pogoNewName);
    expect(cats[2]?.name).to.equal(safiCat.name);
    const pogoNewNewName = 'Bichette';
    const updateByIdResult = await catService.updateById(pogoDoc._id, {
      name: pogoNewNewName,
    });
    expect(updateByIdResult.modifiedCount).to.equal(1);
    const cat = await catService.findById(pogoDoc._id);
    expect(cat?.name).to.equal(pogoNewNewName);
  });

  it('should updateMany cat', async function () {
    await catService.insertMany([pogoCat, safiCat, ortieCat]);
    const newName = 'Pattenrond';
    const updateOneResult = await catService.updateMany({ name: /o/i }, { name: newName });
    expect(updateOneResult.modifiedCount).to.equal(2);
    const cats = await catService.find({}, { sort: { name: 1 } });
    expect(cats).to.be.of.length(3);
    expect(cats[0]).to.be.instanceOf(StrayCat);
    expect(cats[0]?.name).to.equal(newName);
    expect(cats[1]?.name).to.equal(newName);
    expect(cats[2]?.name).to.equal(safiCat.name);
  });

  it('should findOneAndUpdate and findByIdAndUpdate cat', async function () {
    await catService.insert(pogoCat);
    await catService.insert(safiCat);
    const pogoNewName1 = 'Poguette';
    const oldDoc = await catService.findOneAndUpdate(
      { name: /o/i },
      { name: pogoNewName1 },
      { projection: { name: 1 } as const },
    );
    expect(oldDoc).not.be.instanceOf(MongooseDocument);
    expect(oldDoc).to.be.instanceOf(StrayCat);
    expect(oldDoc?.name).to.equal(pogoCat.name);

    // New
    const pogoNewName2 = 'Bichette';
    const newDoc = await catService.findOneAndUpdate(
      { name: /o/i },
      { name: pogoNewName2 },
      { projection: { name: 1 } as const, new: true },
    );
    expect(newDoc).not.be.instanceOf(MongooseDocument);
    expect(newDoc).to.be.instanceOf(StrayCat);
    expect(newDoc?.name).to.equal(pogoNewName2);

    // Upsert
    const newOrtieDoc = await catService.findOneAndUpdate({ name: 'bouzigouloume' }, ortieCat, {
      projection: { name: 1 } as const,
      upsert: true,
    });
    expect(newOrtieDoc).to.be.null;

    // Upsert & New
    const newSilverDoc = await catService.findOneAndUpdate({ name: 'adibou' }, silverCat, {
      upsert: true,
      new: true,
    });
    expect(newSilverDoc).not.be.instanceOf(MongooseDocument);
    expect(newSilverDoc).to.be.instanceOf(HomeCat);
    expect(
      newSilverDoc.name, // SHOULD NOT need `?.` because the typing SHOULD guarantees that newSafiDoc cannot be null.
    ).to.equal(silverCat.name);

    // findByIdAndUpdate
    const newSilverName = 'Silou';
    const updatedDoc = await catService.findByIdAndUpdate(
      newSilverDoc._id,
      {
        name: newSilverName,
      },
      { new: true },
    );
    expect(updatedDoc).not.be.instanceOf(MongooseDocument);
    expect(updatedDoc).to.be.instanceOf(HomeCat);
    expect(updatedDoc?.name).to.equal(newSilverName);
  });

  it('should findOneAndReplace cat with doc exists', async function () {
    await catService.insertMany([pogoCat, safiCat, ortieCat]);
    const oldOrtieDoc = await catService.findOneAndReplace({ name: ortieCat.name }, safiCat);
    expect(oldOrtieDoc).not.be.instanceOf(MongooseDocument);
    expect(oldOrtieDoc).to.be.instanceOf(StrayCat);
    expect(oldOrtieDoc?.name).to.equal(ortieCat.name);
  });

  it('should findOneAndReplace cat with doc doesnt exist', async function () {
    await catService.insertMany([pogoCat, safiCat, ortieCat]);
    const oldOrtieDoc = await catService.findOneAndReplace({ name: 'inexistantCat' }, safiCat);
    expect(oldOrtieDoc).to.be.null;
    oldOrtieDoc?.name; // Type assertion
  });

  it('should findOneAndReplace cat with new = true and doc exists', async function () {
    await catService.insertMany([pogoCat, safiCat, ortieCat]);
    const newPogoDoc = await catService.findOneAndReplace({ name: pogoCat.name }, safiCat, {
      new: true,
    });
    expect(newPogoDoc).not.be.instanceOf(MongooseDocument);
    expect(newPogoDoc).to.be.instanceOf(StrayCat);
    expect(newPogoDoc?.name).to.equal(safiCat.name);
  });

  it('should findOneAndReplace cat with new = true and doc doesnt exist', async function () {
    await catService.insertMany([pogoCat, safiCat, ortieCat]);
    const newPogoDoc = await catService.findOneAndReplace({ name: 'inexistantCat' }, safiCat, {
      new: true,
    });
    expect(newPogoDoc).to.be.null;
  });

  it('should findOneAndReplace cat with new = true, upsert = true and doc exists', async function () {
    await catService.insertMany([pogoCat, safiCat, ortieCat]);
    const newPogoDoc = await catService.findOneAndReplace({ name: pogoCat.name }, safiCat, {
      new: true,
      upsert: true,
    });
    expect(newPogoDoc).not.be.instanceOf(MongooseDocument);
    expect(newPogoDoc).to.be.instanceOf(StrayCat);
    expect(newPogoDoc.name).to.equal(safiCat.name);
  });

  it('should findOneAndReplace cat with new = true, upsert = true and doc doesnt exist', async function () {
    await catService.insertMany([pogoCat, safiCat, ortieCat]);
    const newPogoDoc = await catService.findOneAndReplace({ name: 'inexistantCat' }, safiCat, {
      new: true,
      upsert: true,
    });
    expect(newPogoDoc).not.be.instanceOf(MongooseDocument);
    expect(newPogoDoc).to.be.instanceOf(StrayCat);
    expect(newPogoDoc.name).to.equal(safiCat.name);
  });

  it('should findOneAndReplace cat with new = false, upsert = true and doc exists', async function () {
    await catService.insertMany([pogoCat, safiCat, ortieCat]);
    const oldPogoDoc = await catService.findOneAndReplace({ name: pogoCat.name }, safiCat, {
      new: false,
      upsert: true,
    });
    oldPogoDoc?.name; // Type assertion
    expect(oldPogoDoc).not.be.instanceOf(MongooseDocument);
    expect(oldPogoDoc).to.be.instanceOf(StrayCat);
    expect(oldPogoDoc?.name).to.equal(pogoCat.name);
  });

  it('should findOneAndReplace cat with new = false, upsert = true and doc doesnt exist', async function () {
    await catService.insertMany([pogoCat, safiCat, ortieCat]);
    const newPogoDoc = await catService.findOneAndReplace({ name: 'inexistantCat' }, safiCat, {
      new: false,
      upsert: true,
    });
    newPogoDoc?.name; // Type assertion
    expect(newPogoDoc).to.be.null;
  });

  it('should deleteOne cat', async function () {
    await catService.insert(pogoCat);
    const ortieDoc = await catService.insert(ortieCat);
    const result = await catService.deleteOne({
      name: /o/i,
    });
    expect(result.deletedCount).equal(1);
    {
      const cats = await catService.find();
      expect(cats).to.be.of.length(1);
      expect(cats[0]?.name).to.equal(ortieCat.name);
    }

    // deleteById
    await catService.deleteById(ortieDoc._id);
    {
      const cats = await catService.find();
      expect(cats).to.be.of.length(0);
    }
  });

  it('should findByIdAndDelete cat', async function () {
    const pogoDoc = await catService.insert(pogoCat);
    const deletedPogoDoc = await catService.findByIdAndDelete(pogoDoc._id);
    expect(deletedPogoDoc).not.be.instanceOf(MongooseDocument);
    expect(deletedPogoDoc).to.be.instanceOf(StrayCat);
    expect(deletedPogoDoc).to.be.eql(pogoDoc);
    const count = await catService.countDocuments();
    expect(count).to.equal(0);
    const doc = await catService.findByIdAndDelete(pogoDoc._id);
    expect(doc).to.be.null;
  });

  it('should findOneAndDelete cat', async function () {
    const pogoDoc = await catService.insert(pogoCat);
    const deletedPogoDoc = await catService.findOneAndDelete({ _id: pogoDoc._id });
    expect(deletedPogoDoc).not.be.instanceOf(MongooseDocument);
    expect(deletedPogoDoc).to.be.instanceOf(StrayCat);
    expect(deletedPogoDoc).to.be.eql(pogoDoc);
  });

  it('should deleteMany cat', async function () {
    await catService.insert(pogoCat);
    await catService.insert({ ...pogoCat, name: 'grogro' });
    await catService.insert({ ...pogoCat, name: 'sac-a-dos' });
    await catService.insert(ortieCat);
    await catService.insert(safiCat);
    {
      const res = await catService.deleteMany({ name: /o/i }, { limit: 1 });
      expect(res.deletedCount).to.equal(1);
    }
    {
      const res = await catService.deleteMany({ name: /o/i });
      expect(res.deletedCount).to.equal(3);
    }
    {
      const cats = await catService.find();
      expect(cats).to.be.of.length(1);
      expect(cats[0]?.name).to.equal(safiCat.name);
    }
  });
});
