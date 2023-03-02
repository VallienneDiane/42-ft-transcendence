import { IsNotEmpty, IsString, IsEmail, IsUUID, MinLength, IsBoolean, IsNumber } from "class-validator";
import { UserDto } from "src/user/user.dto";

export class VerifyCodeDto {
    @IsNotEmpty() @IsNumber() code: number;
    user: UserDto;
  }