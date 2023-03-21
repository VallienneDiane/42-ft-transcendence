import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from "typeorm";

@Entity()
export class MessageEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    roomId: string

    @Column('boolean')
    isChannel: boolean

    @Column()
    senderId: string

    @Column('text')
    content: string

    @CreateDateColumn()
    date: Date
}
