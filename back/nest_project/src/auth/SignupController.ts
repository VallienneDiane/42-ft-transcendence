// import { Controller, Post, Body } from '@nestjs/common';
// import { Repository } from 'typeorm';
// import { InjectRepository } from '@nestjs/typeorm';

// import User from './user.entity';

// @Controller('signup')
// export class SignupController {
//   constructor(
//     @InjectRepository(User)
//     private readonly userRepository: Repository<User>,
//   ) {}

//   @Post()
//   async create(@Body() body: { login: string; password: string }) {
//     const user = new User();
//     user.login = body.login;
//     user.password = body.password;

//     await this.userRepository.save(user);
//   }
// }
