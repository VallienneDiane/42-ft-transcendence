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
}