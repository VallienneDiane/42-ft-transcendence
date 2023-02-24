import { IsDate, IsNotEmpty, IsNumber, IsString } from "class-validator";


export class MessageDto {
    @IsNumber() readonly id: number;
    @IsNotEmpty() @IsString() readonly room: string;
    @IsNotEmpty() @IsString() readonly sender: string;
    @IsNotEmpty() @IsString() readonly content: string;
    @IsDate() readonly date: Date;
}