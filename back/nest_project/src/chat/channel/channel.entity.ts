import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToMany, JoinTable } from "typeorm";
import { UserEntity } from "src/user/user.entity";

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

	@ManyToMany(() => UserEntity, (user) => user.channelsAsNormal)
	@JoinTable()
	normalUsers?: UserEntity[];

	@ManyToMany(() => UserEntity, (user) => user.channelsAsOp)
	@JoinTable()
	opUsers?: UserEntity[];
}