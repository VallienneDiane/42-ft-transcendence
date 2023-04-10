import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToMany, JoinTable, ManyToOne, OneToMany } from "typeorm";
import { UserEntity } from "src/user/user.entity";
import { MessageChannelEntity } from "../messageChannel/messageChannel.entity";

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
	inviteOnly: boolean;

	@Column()
	hidden: boolean;

	@ManyToMany(() => UserEntity, (user) => user.channelsAsNormal)
	@JoinTable()
	normalUsers: UserEntity[];

	@ManyToMany(() => UserEntity, (user) => user.channelsAsOp)
	@JoinTable()
	opUsers: UserEntity[];

	@ManyToOne(() => UserEntity, (user) => user.channelsAsGod)
	@JoinTable()
	godUser: UserEntity;

	@OneToMany(() => MessageChannelEntity, (message) => message.channel, {
		eager: true,
	})
	messages: MessageChannelEntity[];

}