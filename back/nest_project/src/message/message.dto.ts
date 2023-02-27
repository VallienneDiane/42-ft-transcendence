import { IsDate, IsNotEmpty, IsNumber, IsString } from "class-validator";


export class MessageDto {
    readonly id: number;
    @IsNotEmpty() @IsString() readonly room: string;
    @IsNotEmpty() @IsString() readonly sender: string;
    @IsNotEmpty() @IsString() readonly content: string;
    readonly date: Date;
}