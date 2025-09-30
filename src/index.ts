import "reflect-metadata";
import fastify from "fastify";
import { config } from "dotenv";
import { AppDataSource } from "./config/data-source.js";
import { userRoutes } from "./routes/user.routes.js";
import { faqRoutes } from "./routes/faq.routes.js";
import { testimonialRoutes } from "./routes/testimonial.routes.js";
import { serviceFeeRoutes } from "./routes/servicefee.routes.js";
import cors from "@fastify/cors";

config(); // Load .env

const app = fastify();

// Enable CORS for cross-origin requests
const allowedOrigins = [
  'http://localhost:9009',
  'http://127.0.0.1:9009',
];

// Add WEB_HOST if it exists
console.log("process1: ", process.env.WEB_HOST)
if (process.env.WEB_HOST) {
  allowedOrigins.push(process.env.WEB_HOST);
}

app.register(cors, {
  origin: process.env.NODE_ENV === 'production' 
    ? (process.env.WEB_HOST || false)
    : allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
});

// Register routes
app.register(userRoutes, { prefix: "/api/users" });
app.register(faqRoutes, { prefix: "/api/faqs" });
app.register(testimonialRoutes, { prefix: "/api/testimonials" });
app.register(serviceFeeRoutes, { prefix: "/api/service-fees" });

// Health check endpoint
app.get('/health', async (request, reply) => {
  return { status: 'OK', timestamp: new Date().toISOString() };
});

// API info endpoint
app.get('/api', async (request, reply) => {
  return { 
    message: 'BlockHeaven API',
    version: '1.0.0',
    endpoints: [
      '/api/users',
      '/api/faqs', 
      '/api/testimonials',
      '/api/service-fees'
    ]
  };
});

// Start server
const start = async () => {
  try {
    await AppDataSource.initialize();
    console.log("Database connected successfully!");

    const port = parseInt(process.env.PORT || "3000");
    const host = process.env.HOST || "localhost";

    await app.listen({ port, host });
    console.log(`Server is running on http://${host}:${port}`);
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
};

start();
