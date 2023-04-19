import { UserEntity } from "src/user/user.entity";
import { Column, Entity, ManyToMany, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Match {
	@PrimaryGeneratedColumn()
	id: number

	@Column()
	score_winner: number

	@Column()
	score_loser: number

	@ManyToOne(() => UserEntity, (winner) => winner.wonMatches)
	winner: UserEntity

	@ManyToOne(() => UserEntity, (loser) => loser.lostMatches)
	loser: UserEntity
}