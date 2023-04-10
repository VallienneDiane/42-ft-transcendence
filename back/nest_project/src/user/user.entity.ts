import { ChannelEntity } from 'src/chat/channel/channel.entity';
import { MessageChannelEntity } from 'src/chat/messageChannel/messageChannel.entity';
import { MessagePrivateEntity } from 'src/chat/messagePrivate/messagePrivate.entity';
import { Entity, Column, PrimaryGeneratedColumn, ManyToMany, JoinTable, ManyToOne, OneToMany } from 'typeorm';
import { FriendEntity } from '../chat/relation/friend/friend.entity';

@Entity()
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  @OneToMany(() => MessagePrivateEntity, (message) => message.receiver)
  messagesReceived: MessagePrivateEntity[];

  @OneToMany(() => MessagePrivateEntity, (message) => message.sender)
  messagesSend: MessagePrivateEntity[];

  @OneToMany(() => MessageChannelEntity, (message) => message.user)
  messagesChannel: MessageChannelEntity[];

  @Column({nullable: true})
  twoFactorSecret: string;

  @Column({nullable: true})
  isTwoFactorEnabled: boolean;

  @Column({nullable: true})
  qrCode: string;

  @Column({nullable: true})
  avatarSvg: string;

  @OneToMany(() => FriendEntity, (request) => request.sender)
  requestsSend : FriendEntity[];

  @OneToMany(() => FriendEntity, (request) => request.receiver)
  requestsReceived : FriendEntity[];
  
}