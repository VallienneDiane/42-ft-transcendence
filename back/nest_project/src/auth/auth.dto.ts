import { IsNotEmpty } from "class-validator";

export class AuthDto {
    @IsNotEmpty()
    readonly id: number;
    @IsNotEmpty()
    readonly firstname: string;
    @IsNotEmpty()
    readonly lastname: string;
    @IsNotEmpty()
    readonly test: string;
}