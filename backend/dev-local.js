/* Alleen voor lokaal testen: start een lokale MongoDB en boot daarna
   server.js. Op Render/productie gebruik je gewoon server.js met
   MONGODB_URI uit de omgeving.

   De data komt in backend/.localdb te staan en blijft dus bewaren tussen
   herstarts — zo kun je lokaal testen dat foto's, bestanden en profielen
   een herstart overleven, net als op Render.

   De mongod-versie staat vast, anders haalt mongodb-memory-server bij elke
   update een nieuwe binary van ~600 MB op. Eén keer downloaden, daarna cache. */
const path = require("path");
const fs = require("fs");
const { MongoMemoryServer } = require("mongodb-memory-server-core");

const DB_PATH = path.join(__dirname, ".localdb");
if (!fs.existsSync(DB_PATH)) fs.mkdirSync(DB_PATH, { recursive: true });

(async () => {
  const mongo = await MongoMemoryServer.create({
    binary: { version: "7.0.24" },
    instance: { dbPath: DB_PATH, storageEngine: "wiredTiger" },
  });
  process.env.MONGODB_URI = mongo.getUri("drerries");
  console.log("lokale database:", DB_PATH);
  require("./server.js");
})();
