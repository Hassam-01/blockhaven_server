import { AppDataSource } from "../config/data-source.js";
import { Contact } from "../entities/contact.entity.js";
import { emailService, ContactFormData } from "./email.service.js";

class ContactService {
    private contactRepository = AppDataSource.getRepository(Contact);

    async createContact(contactData: ContactFormData): Promise<Contact> {
        try {
            // Save to database
            const contact = this.contactRepository.create(contactData);
            const savedContact = await this.contactRepository.save(contact);

            // Send email notification
            await emailService.sendContactFormEmail(contactData);

            return savedContact;
        } catch (error) {
            console.error("Error creating contact:", error);
            throw new Error("Failed to process contact form submission");
        }
    }

    async getAllContacts(): Promise<Contact[]> {
        try {
            return await this.contactRepository.find({
                order: { createdAt: "DESC" }
            });
        } catch (error) {
            console.error("Error fetching contacts:", error);
            throw new Error("Failed to fetch contacts");
        }
    }

    async getContactById(id: number): Promise<Contact | null> {
        try {
            return await this.contactRepository.findOne({ where: { id } });
        } catch (error) {
            console.error("Error fetching contact:", error);
            throw new Error("Failed to fetch contact");
        }
    }

    async deleteContact(id: number): Promise<boolean> {
        try {
            const result = await this.contactRepository.delete(id);
            return result.affected !== 0;
        } catch (error) {
            console.error("Error deleting contact:", error);
            throw new Error("Failed to delete contact");
        }
    }
}

export const contactService = new ContactService();