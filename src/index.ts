import "reflect-metadata";

import fastify from "fastify";
import { AppDataSource } from "./config/data-source.js";
import { userRoutes } from "./routes/user.routes.js";
import { faqRoutes } from "./routes/faq.routes.js";
import { testimonialRoutes } from "./routes/testimonial.routes.js";
import { serviceFeeRoutes } from "./routes/servicefee.routes.js";

const app = fastify();

// Register routes
app.register(userRoutes, { prefix: '/api/users' });
app.register(faqRoutes, { prefix: '/api/faqs' });
app.register(testimonialRoutes, { prefix: '/api/testimonials' });
app.register(serviceFeeRoutes, { prefix: '/api/service-fees' });

// Start server
const start = async () => {
  try {
    // Wait for database connection
    await AppDataSource.initialize();
    console.log("Database connected successfully!");
    
    // Start the server
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
