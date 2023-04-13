import { UserEntity } from "src/user/user.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { ChannelEntity } from "../channel/channel.entity";

@Entity()
export class MuteEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => ChannelEntity, (channel) => channel.usersMuted, {
        cascade: true,
        onDelete: "CASCADE"
    })
    channel: ChannelEntity;

    @ManyToOne(() => UserEntity, (user) => user.mutedList)
    user: UserEntity;

    @CreateDateColumn()
    createdAt: Date;

    @Column()
    deletedAt: Date;
}