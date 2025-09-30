import { DataSource } from "typeorm";
import "dotenv/config";
import { User } from "../entities/user.entity.js";
import { Testimonial } from "../entities/testimonial.entity.js";
import { Faq } from "../entities/faq.entity.js";
import { ServiceFee } from "../entities/servicefee.entity.js";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "Murtajiz001",
  database: process.env.DB_NAME || "blockhaven",
  entities: [User, Testimonial, Faq, ServiceFee],
  synchronize: true,
  logging: true,
});
