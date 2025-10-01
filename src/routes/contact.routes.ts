import { FastifyInstance } from "fastify";
import { contactController } from "../controller/contact.controller.js";
import { AuthMiddleware } from "../middleware/auth.middleware.js";

const authMiddleware = new AuthMiddleware();

export async function contactRoutes(fastify: FastifyInstance) {
    // Public route - anyone can submit contact form
    fastify.post("/contact", contactController.createContact);

    // Protected routes - only authenticated users can view/manage contacts
    fastify.get("/contacts", {
        preHandler: [authMiddleware.authenticate.bind(authMiddleware)]
    }, contactController.getAllContacts);

    fastify.get("/contacts/:id", {
        preHandler: [authMiddleware.authenticate.bind(authMiddleware)]
    }, contactController.getContactById);

    fastify.delete("/contacts/:id", {
        preHandler: [authMiddleware.authenticate.bind(authMiddleware)]
    }, contactController.deleteContact);
}