import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BuildMongestService } from 'src/BuildMongestService';
import { HomeCat } from './home-cat.entity';

@Injectable()
export class HomeCatsService extends BuildMongestService(HomeCat) {
  constructor(@InjectModel(HomeCat.name) public model: Model<HomeCat>) {
    super(model);
  }
}
