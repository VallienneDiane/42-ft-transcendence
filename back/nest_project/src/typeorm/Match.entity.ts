import { UserEntity } from "src/user/user.entity";
import { Column, Entity, ManyToMany, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: 'match' })
export class Match {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToMany(() => UserEntity, UserEntity => UserEntity.login)
    player1: UserEntity;

    @ManyToMany(() => UserEntity, UserEntity => UserEntity.login)
    player2: UserEntity;
}