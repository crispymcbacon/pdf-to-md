import dotenv from "dotenv";
import Fastify from "fastify";
import fastifyCors from "@fastify/cors"; // DEVELOPMENT ONLY
import api from "./api.js";

dotenv.config();

// Create the server
const fastify = Fastify({
  //logger: true,
});

// Use cors only if DEV is set to true
if (process.env.DEV === "true") {
  fastify.register(fastifyCors);
}

// Register the router for handling API routes
fastify.register(api, { prefix: "/api" });

// Start the server
const start = async () => {
  try {
    const PORT = process.env.PORT || 3001;
    await fastify.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`Server is running on port ${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
