import { IsInt, IsString } from 'class-validator'

export class CreateQualityDto {
    @IsString()
    readonly content: string;

    @IsInt()
    readonly grade: number;
}