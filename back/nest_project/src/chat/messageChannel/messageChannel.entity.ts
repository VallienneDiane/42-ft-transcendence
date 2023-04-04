import { UserEntity } from "src/user/user.entity";
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from "typeorm";
import { ChannelEntity } from "../channel/channel.entity";

@Entity()
export class MessageChannelEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('text')
    content: string
    
    @CreateDateColumn()
    date: Date

    @ManyToOne(() => UserEntity, (user) => user.messagesChannel)
    user: UserEntity;
    
    @ManyToOne(() => ChannelEntity, (channel) => channel.messages)
    channel: ChannelEntity;
}
