import { Injectable } from '@nestjs/common';
import { BuildMongestService } from 'src/BuildMongestService';
import { Cat } from './cat.entity';

@Injectable()
export class CatsService extends BuildMongestService(Cat) {
  async findByName(name: string): Promise<Cat | null> {
    const doc = await this.findOne({ name });
    return doc;
  }
}
