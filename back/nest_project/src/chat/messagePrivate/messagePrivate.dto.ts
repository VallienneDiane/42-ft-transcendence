import { IsBoolean, IsDate, IsNotEmpty, IsNumber, IsString } from "class-validator";


export class MessagePrivateDto {
    readonly id: string;
    @IsNotEmpty() @IsString() readonly receiverId: string;
    @IsNotEmpty() @IsString() readonly senderId: string;
    @IsNotEmpty() @IsString() readonly content: string;
    readonly date: Date;
}