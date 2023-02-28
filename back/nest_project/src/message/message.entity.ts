import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from "typeorm";

@Entity()
export class MessageEntity {
    @PrimaryGeneratedColumn('uuid')
    id: number;

    @Column('string')
    room: string

    @Column('boolean')
    isChannel: boolean

    @Column('string')
    sender: string

    @Column('text')
    content: string

    @CreateDateColumn()
    date: Date
}
