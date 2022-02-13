import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Cat } from 'tests/cat-module/cat.entity';
import { registerEntityClassForSchema } from '../../src/registerEntityClassForSchema';

@Schema()
export class HomeCat extends Cat {
  @Prop({ required: true, type: String })
  humanSlave!: string;
}

export const HomeCatSchema = SchemaFactory.createForClass(HomeCat);
registerEntityClassForSchema(HomeCat, HomeCatSchema);
