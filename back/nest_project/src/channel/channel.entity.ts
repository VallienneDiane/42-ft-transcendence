import { Entity, Column, PrimaryColumn } from "typeorm";
import { IChannel } from "./channel.interface";

@Entity()
export class ChannelEntity {
	@PrimaryColumn({
		type: 'varchar',
		nullable: false,
		unique: true
	})
	name: string;

	@Column('simple-array', {
		array: true,
		default: [],
	})
	userList: string[];
}