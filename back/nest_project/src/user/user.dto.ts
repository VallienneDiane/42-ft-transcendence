import { IsNotEmpty, IsString, IsEmail, IsUUID, MinLength, IsBoolean, IsNumber } from "class-validator";

export class UserDto {
    readonly id: number;
    @IsNumber() id42: number;
    @IsNotEmpty() @IsString() readonly login: string;
    @IsNotEmpty() @IsEmail() readonly email: string;
    @IsNotEmpty() @IsString() @MinLength(8) password: string;
    @IsNotEmpty() @IsString() twoFactorSecret: string;
    @IsNotEmpty() @IsBoolean() isTwoFactorEnabled: boolean;
    @IsNotEmpty() @IsString() qrCode: string;
    @IsNotEmpty() avatarSvg: string;
}