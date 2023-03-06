import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

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

  @Column({nullable: true})
  twoFactorSecret: string;

  @Column({nullable: true})
  isTwoFactorEnabled: boolean;

  @Column({nullable: true})
  qrCode: string;
}