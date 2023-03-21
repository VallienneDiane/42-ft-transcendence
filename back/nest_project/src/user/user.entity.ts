import { ChannelEntity } from 'src/chat/channel/channel.entity';
import { Entity, Column, PrimaryGeneratedColumn, ManyToMany, JoinTable } from 'typeorm';

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

  @Column()
  password: string;

  @ManyToMany(() => ChannelEntity, (channel) => channel.normalUsers, {
    eager: true,
  })
  channelsAsNormal?: ChannelEntity[];

  @ManyToMany(() => ChannelEntity, (channel) => channel.opUsers, {
    eager: true,
  })
  channelsAsOp?: ChannelEntity[];

}