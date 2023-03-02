import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from "typeorm";

@Entity()
export class ChannelEntity {
	@PrimaryGeneratedColumn('uuid')
	id: number;

	@CreateDateColumn()
	date: Date;

	@Column({unique: true})
	name: string;

	@Column()
	pass: string;

	@Column()
	inviteOnly: boolean;

	@Column()
	persistant: boolean;
}