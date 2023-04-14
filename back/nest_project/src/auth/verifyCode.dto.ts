import { IsNotEmpty, IsString, IsEmail, IsUUID, MinLength, IsBoolean, IsNumber } from "class-validator";
import { UserDto } from "src/user/user.dto";

export class VerifyCodeDto42 {
    @IsNotEmpty() @IsString() code: string
    @IsNotEmpty() @IsNumber() id42: string
  }

export class VerifyCodeDto {
    @IsNotEmpty() @IsString() code: string
    @IsNotEmpty() @IsString() id: string
  }