import type { AdminRoles } from '../../middleware/auth.middleware.js';
import ContactController from '../../controller/api/contact.controller.js';
import { Router } from 'express';
import { checkRole, authenticate } from '../../middleware/auth.middleware.js';
const contact_router = Router();
// use the correct role type so the array is Role[] instead of string[]
const allowedRoles: ('Admin' | 'Manager')[] = ['Admin', 'Manager'];

/**
 * @swagger
 * components:
 *   schemas:
 *     ContactFormRequest:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - message
 *       properties:
 *         name:
 *           type: string
 *           example: John Doe
 *         email:
 *           type: string
 *           format: email
 *           example: john@example.com
 *         phone:
 *           type: string
 *           example: "081234567890"
 *         message:
 *           type: string
 *           example: "Hello, I need help with..."
 *
 *     ContactResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *
 *     ContactItem:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         email:
 *           type: string
 *         phone:
 *           type: string
 *         name:
 *           type: string
 *         message:
 *           type: string
 *         reply:
 *           type: array
 *           items:
 *             type: object
 *
 *     ReplyRequest:
 *       type: object
 *       required:
 *         - replyMessage
 *       properties:
 *         replyMessage:
 *           type: string
 *           example: "Thanks for reaching out, we've replied..."
 */

/**
 * @swagger
 * /api/contacts/send-email:
 *   post:
 *     summary: Submit contact form (send email & save)
 *     tags: [Contacts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ContactFormRequest'
 *     responses:
 *       201:
 *         description: Contact created and email sent
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ContactResponse'
 *       500:
 *         description: Internal server error
 */
contact_router.post('/send-email', ContactController.sendEmail);

/**
 * @swagger
 * /api/contacts:
 *   get:
 *     summary: Get all contact submissions
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of contacts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ContactItem'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No contacts found
 */
contact_router.get('/', ContactController.getAllContacts);

/**
 * @swagger
 * /api/contacts/{id}:
 *   get:
 *     summary: Get contact by id (with replies)
 *     tags: [Contacts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Contact id
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Contact item
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ContactItem'
 *       400:
 *         description: Invalid id
 *       404:
 *         description: Contact not found
 */
contact_router.get('/:id', ContactController.getContactById);

/**
 * @swagger
 * /api/contacts/{id}/reply:
 *   post:
 *     summary: Reply to a contact (admin/manager)
 *     tags: [Contacts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Contact id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReplyRequest'
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reply created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 contactId:
 *                   type: integer
 *                 replyMessage:
 *                   type: string
 *                 replyBy:
 *                   type: integer
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Contact or admin user not found
 */
contact_router.post('/:id/reply', authenticate, checkRole(allowedRoles), ContactController.replyToContact);

export default contact_router;