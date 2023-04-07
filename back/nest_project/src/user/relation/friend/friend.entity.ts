import { UserEntity } from "src/user/user.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class FriendEntity {
	@PrimaryGeneratedColumn('uuid')
  	id: string;

	@ManyToOne(() => UserEntity, (user) => user.requestsSend)
	sender: UserEntity;

	@ManyToOne(() => UserEntity, (user) => user.requestsReceived)
	receiver: UserEntity;

	@Column()
	state: string;

}