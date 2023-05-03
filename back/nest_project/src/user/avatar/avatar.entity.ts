import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class AvatarEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({nullable: true})
    avatarSvg: string;
};