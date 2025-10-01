import { FastifyRequest, FastifyReply } from "fastify";
import { contactService } from "../services/contact.service.js";
import { ContactFormData } from "../services/email.service.js";

interface ContactRequest {
    name: string;
    email: string;
    phone?: string;
    subject?: string;
    message: string;
}

class ContactController {
    async createContact(
        request: FastifyRequest<{ Body: ContactRequest }>,
        reply: FastifyReply
    ) {
        try {
            const { name, email, phone, subject, message } = request.body;

            // Validation
            if (!name || !email || !message) {
                return reply.status(400).send({
                    error: "Name, email, and message are required fields"
                });
            }

            // Basic email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return reply.status(400).send({
                    error: "Please provide a valid email address"
                });
            }

            // Length validations
            if (name.length > 100) {
                return reply.status(400).send({
                    error: "Name must be less than 100 characters"
                });
            }

            if (email.length > 255) {
                return reply.status(400).send({
                    error: "Email must be less than 255 characters"
                });
            }

            if (phone && phone.length > 20) {
                return reply.status(400).send({
                    error: "Phone number must be less than 20 characters"
                });
            }

            if (subject && subject.length > 200) {
                return reply.status(400).send({
                    error: "Subject must be less than 200 characters"
                });
            }

            if (message.length > 2000) {
                return reply.status(400).send({
                    error: "Message must be less than 2000 characters"
                });
            }

            const contactData: ContactFormData = {
                name: name.trim(),
                email: email.trim().toLowerCase(),
                ...(phone && { phone: phone.trim() }),
                ...(subject && { subject: subject.trim() }),
                message: message.trim()
            };

            const contact = await contactService.createContact(contactData);

            reply.status(201).send({
                message: "Contact form submitted successfully! We'll get back to you soon.",
                contact: {
                    id: contact.id,
                    name: contact.name,
                    email: contact.email,
                    createdAt: contact.createdAt
                }
            });
        } catch (error) {
            console.error("Error in createContact:", error);
            reply.status(500).send({
                error: "Failed to submit contact form. Please try again later."
            });
        }
    }

    async getAllContacts(request: FastifyRequest, reply: FastifyReply) {
        try {
            const contacts = await contactService.getAllContacts();
            reply.send({
                message: "Contacts retrieved successfully",
                contacts
            });
        } catch (error) {
            console.error("Error in getAllContacts:", error);
            reply.status(500).send({
                error: "Failed to retrieve contacts"
            });
        }
    }

    async getContactById(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply
    ) {
        try {
            const id = parseInt(request.params.id);
            
            if (isNaN(id)) {
                return reply.status(400).send({
                    error: "Invalid contact ID"
                });
            }

            const contact = await contactService.getContactById(id);
            
            if (!contact) {
                return reply.status(404).send({
                    error: "Contact not found"
                });
            }

            reply.send({
                message: "Contact retrieved successfully",
                contact
            });
        } catch (error) {
            console.error("Error in getContactById:", error);
            reply.status(500).send({
                error: "Failed to retrieve contact"
            });
        }
    }

    async deleteContact(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply
    ) {
        try {
            const id = parseInt(request.params.id);
            
            if (isNaN(id)) {
                return reply.status(400).send({
                    error: "Invalid contact ID"
                });
            }

            const deleted = await contactService.deleteContact(id);
            
            if (!deleted) {
                return reply.status(404).send({
                    error: "Contact not found"
                });
            }

            reply.send({
                message: "Contact deleted successfully"
            });
        } catch (error) {
            console.error("Error in deleteContact:", error);
            reply.status(500).send({
                error: "Failed to delete contact"
            });
        }
    }
}

export const contactController = new ContactController();