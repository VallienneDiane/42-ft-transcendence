import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class LinkUCEntity {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column()
	userId: string;

	@Column()
	channelId: string;

	@CreateDateColumn()
	date: Date;

	@Column()
	isOp: boolean;
}