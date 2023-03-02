import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from "typeorm";

@Entity()
export class MessageEntity {
    @PrimaryGeneratedColumn('uuid')
    id: number;

    @Column()
    room: string

    @Column('boolean')
    isChannel: boolean

    @Column()
    sender: string

    @Column('text')
    content: string

    @CreateDateColumn()
    date: Date
}
