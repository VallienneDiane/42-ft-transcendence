import { UserEntity } from "src/user/user.entity";
import { Column, Entity, ManyToMany, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Match {
	@PrimaryGeneratedColumn()
	id: number

	@Column()
	score_winner: number

	@Column()
	score_looser: number

	@OneToMany(() => UserEntity, (winner) => winner.match)
	winner: UserEntity

	@OneToMany(() => UserEntity, (looser) => looser.match)
	looser: UserEntity
}