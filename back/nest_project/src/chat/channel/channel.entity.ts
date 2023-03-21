import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from "typeorm";

@Entity()
export class ChannelEntity {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@CreateDateColumn()
	date: Date;

	@Column({unique: true})
	name: string;

	@Column()
	password: boolean;

	@Column({nullable: true})
	channelPass: string;

	@Column()
	opNumber: number;

	@Column()
	inviteOnly: boolean;

	@Column()
	persistant: boolean;

	@Column()
	onlyOpCanTalk: boolean;

	@Column()
	hidden: boolean;
}