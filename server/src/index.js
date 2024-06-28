import dotenv from "dotenv";
import Fastify from "fastify";
import fastifyCors from "@fastify/cors"; // DEVELOPMENT ONLY
import api from "./api.js";
import fastifyMultipart from "@fastify/multipart";
import fs from "fs";
import authPlugin from "./auth-plugin.js"; // Import the authentication plugin
import fastifyStatic from "@fastify/static";
import path from "path";

const __dirname = path.resolve();

dotenv.config();

// Create the server
const fastify = Fastify({
  //logger: true,
});

// Use cors only if DEV is set to true
if (process.env.DEV === "true") {
  console.log("CORS enabled");
  fastify.register(fastifyCors);
}

fastify.register(fastifyStatic, {
  root: path.join(__dirname, "public"),
  prefix: "/public/",
});

// Register the multipart plugin
fastify.register(fastifyMultipart);

// Register the authentication plugin
fastify.register(authPlugin);

// Register the router for handling API routes
fastify.register(api, { prefix: "/api" });

// Ensure the output directory exists
if (!fs.existsSync("./out")) {
  fs.mkdirSync("./out", { recursive: true });
}
// Ensure the tmp directory exists
if (!fs.existsSync("./tmp")) {
  fs.mkdirSync("./tmp", { recursive: true });
}

// Start the server
const start = async () => {
  try {
    const PORT = process.env.PORT || 3000;
    await fastify.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`Server is running on port ${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
