import { Injectable } from '@nestjs/common';
import { JohnBouleQualities } from './interfaces/JohnBouleQualities.interface';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World! Controller available : /johnboule';
  }
}

@Injectable()
export class JohnBouleService {
  private readonly qualities: JohnBouleQualities[] = [];

  create(quality: JohnBouleQualities) {
    this.qualities.push(quality);
  }

  show(): JohnBouleQualities[] {
    return this.qualities;
  }
}