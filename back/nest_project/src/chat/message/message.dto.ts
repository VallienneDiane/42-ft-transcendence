import { IsBoolean, IsDate, IsNotEmpty, IsNumber, IsString } from "class-validator";


export class MessageDto {
    readonly id: string;
    @IsNotEmpty() @IsString() readonly roomId: string;
    @IsNotEmpty() @IsBoolean() readonly isChannel: boolean;
    @IsNotEmpty() @IsString() readonly senderId: string;
    @IsNotEmpty() @IsString() readonly content: string;
    readonly date: Date;
}