import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class LinkUCEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	userName: string;

	@Column()
	channelName: string;

	@CreateDateColumn()
	date: Date;

	@Column()
	isOp: boolean;
}