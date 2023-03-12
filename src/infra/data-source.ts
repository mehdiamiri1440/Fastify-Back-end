import { ASN } from "$src/domains/inbound/models/ASN.js";
import { Customer } from "$src/domains/customer/models/Customer.js";
import { DataSource } from "typeorm/data-source/DataSource.js";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "user",
  password: "pass",
  database: "inventory",
  synchronize: true,

  logging: true,
  entities: [Customer, ASN],
  subscribers: [],
  migrations: [],
});

await AppDataSource.initialize();
