// src/services/audit.service.ts
import { prisma } from "../config/prisma.config.js";
import { Prisma } from "../../generated/prisma/browser.js";
import logger from "../utils/logger.js";
export class AuditService {
  static async log(data: {
    action: string;
    entity: string;
    entity_id?: number;
    user_id?: number;
    admin_id?: number;
    old_data?: any;
    new_data?: any;
    ip_address?: string;
    user_agent?: string;
  }) {
    try {
      await prisma.auditLog.create({
        data: {
          ...data,
          old_data: data.old_data ?? Prisma.JsonNull,
          new_data: data.new_data ?? Prisma.JsonNull,
        }
      });
    } catch (error) {
      // Fallback ke file log jika DB audit gagal
      logger.error('Failed to write audit log', { error, data });
    }
  }
}