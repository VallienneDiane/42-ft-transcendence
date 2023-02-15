// import { Injectable } from "@nestjs/common";
// import { UserEntity } from "src/user/user.entity";
// import { UserService } from "src/user/user.service";
// import * as bcrypt from 'bcrypt';

// @Injectable()
// export class AuthService {
//     constructor(private readonly userService: UserService) {
//         async validateUser(user: UserEntity): Promise<UserEntity> {
//             const user = await this.userService.findOne(user.login);
//             const passwordValid = await bcrypt.compare(password, user.password);
//         }
//     }
// }