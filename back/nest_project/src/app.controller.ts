import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

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
  @Get('look')
  showBoule(): string {
    return 'OO';
  }
  @Get('isAvailable')
  isAvailable(): string {
    return 'Always!';
  }
  @Get()
  mainPageOfJohnBoule(): string {
    return 'Hello ! Welcome to the "Boule a John" main page. You can : /look to see it or /isAvailable to ask if it is available';
  }
}