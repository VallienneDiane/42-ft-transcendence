import { Match } from 'src/typeorm/Match.entity';
import { Entity, Column, PrimaryGeneratedColumn, OneToMany, JoinColumn, ManyToMany } from 'typeorm';

@Entity()
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

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

  @ManyToMany(() => Match, Match => Match.player1, {onDelete: 'CASCADE'})
  @ManyToMany(() => Match, Match => Match.player2, {onDelete: 'CASCADE'})
  @JoinColumn()
  match: Match[];

}