import { prisma } from "../config/prisma.config.js";

export interface IContactRepository {
    createContact(data: any): Promise<any>;
    getAllContacts(): Promise<any[]>;
    getContactById(id: number): Promise<any>;
    deleteContact(id: number): Promise<any>;
}

export class ContactRepository implements IContactRepository {
    async createContact(data: any): Promise<any> {
        return await prisma.contactForm.create({
            data
        });
    }

    async getAllContacts(): Promise<any[]> {
        return await prisma.contactForm.findMany({
            include: {
                response: true
            }
        });
    }
    async getContactById(id: number): Promise<any> {
        return await prisma.contactForm.findUnique({
            where: { id },
            include: {
                response: true
            }
        });
    }

    async deleteContact(id: number): Promise<any> {
        return await prisma.contactForm.update({
            where: { id },
            data: { deletedAt: new Date() }
        });
    }

    async replyToContact(contactId: number, replyMessage: string, replyBy: number): Promise<any> {
        // Fetch contact data to get name, email, phone, title
        const contact = await prisma.contactForm.findUnique({
            where: { id: contactId }
        });

        if (!contact) {
            throw new Error("Contact not found");
        }

        const uuidGenerator = `REPLY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        return await prisma.responseContact.create({
            data: {
                unique_id: uuidGenerator,
                name: contact.name,
                email: contact.email,
                phone: contact.phone,
                title: contact.title,
                contacatId: contactId,
                Message: replyMessage,
                RespondenId: replyBy
            }
        });
    }
}
