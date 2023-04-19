import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToMany, JoinTable, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { UserEntity } from "src/user/user.entity";
import { MessageChannelEntity } from "../messageChannel/messageChannel.entity";
import { MuteEntity } from "../mute/mute.entity";

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

	@ManyToMany(() => UserEntity, (user) => user.channelsAsNormal)
	@JoinTable()
	normalUsers: UserEntity[];

	@ManyToMany(() => UserEntity, (user) => user.channelsAsOp)
	@JoinTable()
	opUsers: UserEntity[];

	@ManyToOne(() => UserEntity, (user) => user.channelsAsGod)
	@JoinTable()
	godUser: UserEntity;

	@ManyToMany(() => UserEntity, (user) => user.channelsAsBanned)
	@JoinTable()
	bannedUsers: UserEntity[];

	@OneToMany(() => MessageChannelEntity, (message) => message.channel, {
	})
	messages: MessageChannelEntity[];

	@OneToMany(() => MuteEntity, (muted) => muted.channel)
	usersMuted: MuteEntity[];
}