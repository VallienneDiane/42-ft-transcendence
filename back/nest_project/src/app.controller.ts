import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { JohnBouleService } from './app.service';
import { JohnBouleQualities } from './interfaces/JohnBouleQualities.interface';
import { CreateQualityDto } from './dto/create-quality.dto';

//Controller purpose is to receive requests
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  
  getHello(): string {
    return this.appService.getHello();
  }
}

@Controller('johnboule')
export class BoolJohnController {
  constructor(private johnBouleService: JohnBouleService) {}

  @Get('look')
  showBoule(): string {
    return 'OO';
  }
  @Get('isAvailable')
  isAvailable(): string {
    return 'Always!';
  }
  @Get()
  mainPageOfJohnBoule(): any {
    return (
      {
        welcomeMsg: 'Welcome to the main boule a John page',
        possibleAccesses: ['/look', '/isAvailable'],
      }
    );
  }
  @Get('qualities')
  async listQualities(): Promise<JohnBouleQualities[]> {
    return this.johnBouleService.show();
  }
  @Post()
  async create(@Body() createQualityDto: CreateQualityDto) {
    this.johnBouleService.create(createQualityDto);
  }
}