import { Match } from 'src/match/Match';
import { ChannelEntity } from 'src/chat/channel/channel.entity';
import { MessageChannelEntity } from 'src/chat/messageChannel/messageChannel.entity';
import { MessagePrivateEntity } from 'src/chat/messagePrivate/messagePrivate.entity';
import { MuteEntity } from 'src/chat/mute/mute.entity';
import { Entity, Column, PrimaryGeneratedColumn, ManyToMany, JoinTable, ManyToOne, OneToMany, JoinColumn, OneToOne } from 'typeorm';
import { FriendEntity } from '../chat/friend/friend.entity';
import { AvatarEntity } from './avatar/avatar.entity';

@Entity()
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({nullable: true, unique: true})
  id42: string;

  @Column(
    {type: 'varchar', 
     nullable: false,
     unique: true}
  )
  login: string;

  @Column()
  email: string;

  @Column({nullable: true})
  password: string;

  @ManyToMany(() => ChannelEntity, (channel) => channel.normalUsers, {
    eager: true,
  })
  channelsAsNormal: ChannelEntity[];

  @ManyToMany(() => ChannelEntity, (channel) => channel.opUsers, {
    eager: true,
  })
  channelsAsOp: ChannelEntity[];

  @OneToMany(() => ChannelEntity, (channel) => channel.godUser, {
    eager: true
  })
  channelsAsGod: ChannelEntity[];

  @ManyToMany(() => ChannelEntity, (channel) => channel.bannedUsers)
  channelsAsBanned: ChannelEntity[];

  @OneToMany(() => MessagePrivateEntity, (message) => message.receiver)
  messagesReceived: MessagePrivateEntity[];

  @OneToMany(() => MessagePrivateEntity, (message) => message.sender)
  messagesSend: MessagePrivateEntity[];

  @OneToMany(() => MessageChannelEntity, (message) => message.user)
  messagesChannel: MessageChannelEntity[];

  @Column({nullable: true})
  twoFactorSecret: string;

  @Column({default: false})
  isTwoFactorEnabled: boolean;

  @Column({nullable: true})
  qrCode: string;

  @OneToOne(() => AvatarEntity, {cascade: true})
  @JoinColumn()
  avatarSvg: AvatarEntity;

  @OneToMany(() => Match, (match) => match.winner)
  @JoinColumn({ name: "winner_id" })
  wonMatches: Match[];

  @OneToMany(() => Match, (match) => match.loser)
  @JoinColumn({ name: "loser_id" })
  lostMatches: Match[];

  @OneToMany(() => FriendEntity, (request) => request.sender)
  requestsSend : FriendEntity[];

  @OneToMany(() => FriendEntity, (request) => request.receiver)
  requestsReceived : FriendEntity[];

  @ManyToMany(() => UserEntity, (user) => user.blockedMeList)
  @JoinTable()
  blockList: UserEntity[];

  @ManyToMany(() => UserEntity, (user) => user.blockList)
  blockedMeList: UserEntity[];

  @OneToMany(() => MuteEntity, (muted) => muted.user)
  mutedList: MuteEntity[];
}