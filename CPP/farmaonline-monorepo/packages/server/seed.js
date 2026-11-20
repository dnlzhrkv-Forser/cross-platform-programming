import "dotenv/config";
import dns from "node:dns";
import mongoose from "mongoose";
import { PharmacyService } from "@farmaonline/core";
import { Medicine, Order } from "./models.js";
import { MongoPharmacyRepository } from "./mongoRepository.js";
import { SEED_MEDICINES } from "./seedData.js";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 8000 });
const service = new PharmacyService(new MongoPharmacyRepository({ Medicine, Order }));
const { seeded } = await service.seed(SEED_MEDICINES);
console.log(seeded ? `Додано тестові препарати: ${seeded}` : "У колекції вже є препарати — seed пропущено");
await mongoose.disconnect();
