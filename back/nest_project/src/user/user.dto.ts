import { IsNotEmpty, IsString, IsEmail, IsUUID, MinLength } from "class-validator";

export class UserDto {
    readonly id: number;
    @IsNotEmpty() @IsString() readonly login: string;
    @IsNotEmpty() @IsEmail() readonly email: string;
    @IsNotEmpty() @IsString() @MinLength(8) password: string;
}