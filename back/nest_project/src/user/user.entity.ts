import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { Unique } from 'typeorm';

@Entity()
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: number;

  @Column()
  login: string;
  
  @Column()
  email: string;

  @Column()
  password: string;
}