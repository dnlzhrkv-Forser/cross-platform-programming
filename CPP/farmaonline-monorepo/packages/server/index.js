import "dotenv/config";
import dns from "node:dns";
import { PharmacyService } from "@farmaonline/core";
import { createApp } from "./app.js";
import { connectDB, isDbReady } from "./db.js";
import { Medicine, Order } from "./models.js";
import { MongoPharmacyRepository } from "./mongoRepository.js";

dns.setServers(["8.8.8.8", "1.1.1.1"]); // обхід проблем DNS (querySrv ECONNREFUSED)

// Адаптер MongoDB підставляється в спільний сервіс ядра
const service = new PharmacyService(new MongoPharmacyRepository({ Medicine, Order }));
const app = createApp({ service, isDbReady });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`ФармаОнлайн: http://localhost:${PORT}`));

connectDB(process.env.MONGO_URI);
