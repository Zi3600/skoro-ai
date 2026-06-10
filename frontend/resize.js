const sharp = require("sharp");

sharp("icon.png").resize(192, 192).toFile("icon-192.png", () => console.log("icon-192.png done"));
sharp("icon.png").resize(512, 512).toFile("icon-512.png", () => console.log("icon-512.png done"));
