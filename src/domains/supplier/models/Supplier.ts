import { User } from "$src/domains/user/models/User.js";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from "typeorm";
import { Language } from "./Language.js";
// import { SupplierLogoFile } from "./SupplierLogoFile.js";

@Entity()
export class Supplier {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column()
  cif!: string;

  @ManyToOne(() => Language, { nullable: false })
  language!: Language;

  @Column()
  iban!: string;

  @Column()
  email!: string;

  @Column()
  phoneNumber!: string;

  @Column()
  logoFileId?: string;

  @Column()
  accountNumber!: string;

  @Column({ nullable: true })
  bic?: string;

  @Column({ nullable: true })
  bicName?: string;

  @ManyToOne(() => User, { nullable: false })
  creator!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
