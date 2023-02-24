import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from "typeorm";

@Entity()
export class MessageEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('string')
    room: string

    @Column('string')
    sender: string

    @Column('text')
    content: string

    @CreateDateColumn()
    @Column()
    date: Date
}
