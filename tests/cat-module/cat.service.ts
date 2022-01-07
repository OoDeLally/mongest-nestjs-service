import { Injectable } from '@nestjs/common';
import { BuildMongestService } from 'src/BuildMongestService';
import { Cat } from './cat.entity';

@Injectable()
export class CatsService extends BuildMongestService(Cat) {}
