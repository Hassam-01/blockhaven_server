import "reflect-metadata";
import fastify from "fastify";
import { config } from "dotenv";
import { AppDataSource } from "./config/data-source.js";
import { EnvValidation } from "./config/env-validation.js";
import { userRoutes } from "./routes/user.routes.js";
import { faqRoutes } from "./routes/faq.routes.js";
import { testimonialRoutes } from "./routes/testimonial.routes.js";
import { serviceFeeRoutes } from "./routes/servicefee.routes.js";
import { contactRoutes } from "./routes/contact.routes.js";
import { exchangeRoutes } from "./routes/exchange.routes.js";
import { emailService } from "./services/email.service.js";
import cors from "@fastify/cors";

config(); // Load .env

// Validate environment variables
EnvValidation.validate();
const envConfig = EnvValidation.getConfig();

const app = fastify();

// Enable CORS for cross-origin requests
const allowedOrigins = [
  'http://localhost:9009',
  'http://127.0.0.1:9009',
];

// Add WEB_HOST if it exists
if (process.env.WEB_HOST) {
  allowedOrigins.push(process.env.WEB_HOST);
}

app.register(cors, {
  origin: envConfig.isProduction 
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
app.register(contactRoutes, { prefix: "/api" });
app.register(exchangeRoutes, { prefix: "/api/exchanges" });

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
      '/api/service-fees',
      '/api/contact',
      '/api/contacts',
      '/api/exchanges'
    ]
  };
});

// Start server
const start = async () => {
  try {
    await AppDataSource.initialize();
    console.log("Database connected successfully!");

    // Verify SMTP connection
    const smtpConnected = await emailService.verifyConnection();
    if (smtpConnected) {
      console.log("SMTP connection verified successfully!");
    } else {
      console.warn("Warning: SMTP connection failed. Email functionality may not work.");
    }

    const port = envConfig.PORT;
    const host = envConfig.HOST;

    await app.listen({ port, host });
    console.log(`🚀 Server is running on http://${host}:${port}`);
    console.log(`📊 Environment: ${envConfig.NODE_ENV}`);
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
};

start();
