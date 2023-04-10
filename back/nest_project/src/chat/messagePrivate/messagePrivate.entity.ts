import { UserEntity } from "src/user/user.entity";
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from "typeorm";

@Entity()
export class MessagePrivateEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => UserEntity, (user) => user.messagesSend)
    sender: UserEntity;

    @ManyToOne(() => UserEntity, (user) => user.messagesReceived)
    receiver: UserEntity;

    @Column('text')
    content: string;

    @CreateDateColumn()
    date: Date;
}
