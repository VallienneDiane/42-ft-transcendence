import { IsNotEmpty, IsString, IsEmail, IsUUID, MinLength, IsBoolean } from "class-validator";

export class UserDto {
    readonly id: number;
    @IsNotEmpty() @IsString() readonly login: string;
    @IsNotEmpty() @IsEmail() readonly email: string;
    @IsNotEmpty() @IsString() @MinLength(8) password: string;
    @IsNotEmpty() @IsString() twoFactorSecret: string;
    @IsNotEmpty() @IsBoolean() isTwoFactorEnabled: boolean;
    @IsNotEmpty() @IsString() qrCode: string;
    @IsNotEmpty() @IsString() avatarSvg: string;
}