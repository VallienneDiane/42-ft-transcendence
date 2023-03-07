import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from "typeorm";

@Entity()
export class ChannelEntity {
	@PrimaryGeneratedColumn('uuid')
	id: number;

	@CreateDateColumn()
	date: Date;

	@Column({unique: true})
	name: string;

	@Column({nullable: true})
	pass: string;

	@Column()
	inviteOnly: boolean;

	@Column()
	persistant: boolean;

	@Column()
	onlyOpCanTalk: boolean;

	@Column()
	hidden: boolean;
}