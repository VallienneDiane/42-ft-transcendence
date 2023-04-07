import { UserEntity } from "src/user/user.entity";
import { Column, Entity, ManyToMany, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Match {
	@PrimaryGeneratedColumn()
	id: number

	@Column()
	score_p1: number

	@Column()
	score_p2: number

	@OneToMany(() => UserEntity, (player1) => player1.match)
	player1: UserEntity

	@OneToMany(() => UserEntity, (player2) => player2.match)
	player2: UserEntity
}