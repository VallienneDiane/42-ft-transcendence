import { Match } from 'src/type_orm/Match';
import { Entity, Column, PrimaryGeneratedColumn, ManyToMany, JoinTable, JoinColumn, ManyToOne } from 'typeorm';

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

  @Column({nullable: true})
  password: string;

  @Column({nullable: true})
  twoFactorSecret: string;

  @Column({nullable: true})
  isTwoFactorEnabled: boolean;

  @Column({nullable: true})
  qrCode: string;

  @Column({nullable: true})
  avatarSvg: string;

  @ManyToOne(() => Match, (match) => (match.player1, match.player2))
  @JoinColumn()
  match: Match[]
}