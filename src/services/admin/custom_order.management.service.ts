import logger, { logInfo, logError, logWarn, logAudit } from "../../utils/logger.js";
import HttpException from "../../utils/HttpExecption.js";
import validatorCustomOrder from "../../middleware/validaator/custom_order.validator.js";
import type {
    createCustomOrderRequest,
    updateCustomOrderRequest,
    customOrderResponse,
    terimaCustomOrderRequest,
    tolakCustomOrderRequest,
    dealNegosiasiRequest,
    batalPemesananRequest,
    ICustomOrderManagementRepository
} from "../../interfaces/custom_order.interface.js";

import type { Requester } from "../../interfaces/auth.interface.js";
import MailerService from "../mailer.service.js";
import { CustomOrderManagementRepository } from "../../repository/admin/custom_order.management.repository.js";

class CustomOrderManagement implements ICustomOrderManagementRepository {
    private customOrderManagementRepo = new CustomOrderManagementRepository();

    async createCustomOrder(data: createCustomOrderRequest): Promise<customOrderResponse> {
        // Validate user_id
        if (!data.user_id) {
            logger.warn("createCustomOrder called without user_id");
            throw new HttpException(400, "user_id is required");
        }

        // Validate with Zod schema
        const parsed = validatorCustomOrder.createSchema.safeParse(data);
        if (!parsed.success) {
            logger.warn("createCustomOrder validation failed", { issues: parsed.error.issues });
            const message = parsed.error.issues
                .map(i => `${i.path.join('.') || '<root>'}: ${i.message}`)
                .join('; ');
            throw new HttpException(400, message);
        }

        // Business logic validation - Material
        if (data.material_sendiri === true) {
            parsed.data.material_id = null;
        } else if (data.material_sendiri === false && !data.material_id) {
            logger.warn("createCustomOrder called with material_sendiri false but no material_id");
            throw new HttpException(400, "material_id is required when material_sendiri is false");
        }

        // Business logic validation - File referensi
        if (data.referensi_custom === true) {
            if (!data.file_referensi_custom || data.file_referensi_custom.length === 0) {
                logger.warn("createCustomOrder called with referensi_custom true but no file_referensi_custom");
                throw new HttpException(400, "file_referensi_custom is required when referensi_custom is true");
            }
        } else if (data.referensi_custom === false) {
            parsed.data.file_referensi_custom = null;
            if (!data.model_baju_id) {
                logger.warn("createCustomOrder called with referensi_custom false but no model_baju_id");
                throw new HttpException(400, "model_baju_id is required when referensi_custom is false");
            }
        }

        try {
            const result = await this.customOrderManagementRepo.createCustomOrder(parsed.data as createCustomOrderRequest);

            // Log success dengan audit trail
            logAudit("CUSTOM_ORDER_CREATED", {
                order_id: result.id,
                unique_id: result.unique_id,
                user_id: result.user_id,
                nama_pemesanan: result.nama_pemesanan,
                jumlah_barang: result.jumlah_barang,
                material_sendiri: result.material_sendiri,
                material_id: result.material_id,
                model_baju_id: result.model_baju_id,
                referensi_custom: result.referensi_custom,
                file_referensi_custom: result.file_referensi_custom
            });

            logInfo("Custom order created successfully", {
                order_id: result.id,
                unique_id: result.unique_id,
                user_id: result.user_id
            });

            // Send email notification to admin (moved to MailerService)
            try {
                await MailerService.sendCustomOrderNotification(result.id, result.unique_id);
            } catch (emailErr: any) {
                // Log error tapi tidak throw, agar pembuatan order tetap berhasil
                logError("Failed to send notification email to admin", {
                    order_id: result.id,
                    error: emailErr?.message
                });
            }

            return result;
        } catch (err: any) {
            // Re-throw HttpException as-is (preserve status code)
            if (err instanceof HttpException) {
                throw err;
            }

            // Handle Prisma specific errors
            if (err?.name === "PrismaClientValidationError" || err?.code === "P2021" || err?.code === "P2002") {
                logger.error("Prisma validation error creating custom order", {
                    message: err?.message,
                    code: err?.code
                });
                throw new HttpException(400, err?.message ?? "Invalid data provided");
            }

            // Unexpected errors jadi 500
            logger.error("Unexpected error creating custom order", {
                message: err?.message,
                name: err?.name,
                stack: err?.stack
            });
            throw new HttpException(500, "Failed to create custom order");
        }
    }

    async updateCustomOrder(id: number, data: updateCustomOrderRequest): Promise<customOrderResponse> {
        // Validate with Zod schema
        const parsed = validatorCustomOrder.updateSchema.safeParse(data);
        if (!parsed.success) {
            logger.warn("updateCustomOrder validation failed", { issues: parsed.error.issues });
            const message = parsed.error.issues
                .map(i => `${i.path.join('.') || '<root>'}: ${i.message}`)
                .join('; ');
            throw new HttpException(400, message);
        }

        try {
            const result = await this.customOrderManagementRepo.updateCustomOrder(id, parsed.data as updateCustomOrderRequest);

            logInfo("Custom order updated successfully", { order_id: id });
            return result;
        } catch (err: any) {
            // Re-throw HttpException as-is
            if (err instanceof HttpException) {
                throw err;
            }

            // Handle Prisma errors
            if (err?.code === "P2025") {
                logger.warn("Custom order not found for update", { id });
                throw new HttpException(404, "Custom order not found");
            }

            // Unexpected errors
            logger.error("Unexpected error updating custom order", {
                id,
                message: err?.message,
                stack: err?.stack
            });
            throw new HttpException(500, "Failed to update custom order");
        }
    }

    async getAllCustomOrders(
        params?: {
            q?: string;
            page?: number;
            limit?: number;
            sortBy?: string;
            sortOrder?: "asc" | "desc";
        },
        requester?: Requester
    ): Promise<customOrderResponse[]> {
        try {
            const where: any = {};

            // Search filter
            if (params?.q) {
                const q = String(params.q).trim();
                where.OR = [
                    { nama_pemesanan: { contains: q, mode: "insensitive" } },
                    { unique_id: { contains: q, mode: "insensitive" } },
                    { warna: { contains: q, mode: "insensitive" } }
                ];
            }

            // Access control: batasi untuk user non-admin
            const role = requester?.role ?? "User";
            if (requester && role !== "Admin" && role !== "Manager") {
                where.user_id = requester.id;
            }

            // Pagination
            const page = params?.page && params.page > 0 ? Math.floor(params.page) : 1;
            const limit = params?.limit && params.limit > 0 ? Math.floor(params.limit) : 25;
            const skip = (page - 1) * limit;

            // Sorting
            const sortBy = params?.sortBy || "createdAt";
            const sortOrder: "asc" | "desc" = params?.sortOrder || "desc";

            const orders = await this.customOrderManagementRepo.findCustomOrder({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder } as any
            });

            logInfo("Custom orders retrieved successfully", {
                count: orders.length,
                page,
                limit
            });

            return orders;
        } catch (err: any) {
            // Re-throw HttpException as-is
            if (err instanceof HttpException) {
                throw err;
            }

            // Unexpected errors
            logger.error("Unexpected error fetching custom orders", {
                message: err?.message,
                stack: err?.stack,
                params
            });
            throw new HttpException(500, "Failed to retrieve custom orders");
        }
    }

    async getCustomOrderById(id: number): Promise<customOrderResponse> {
        try {
            const order = await this.customOrderManagementRepo.getCustomOrderById(id);

            // Check if order exists
            if (!order) {
                logger.warn("Custom order not found", { id });
                throw new HttpException(404, "Custom order not found");
            }

            logInfo("Custom order retrieved successfully", { order_id: id });
            return order;
        } catch (err: any) {
            // Re-throw HttpException as-is (preserve status code)
            if (err instanceof HttpException) {
                throw err;
            }

            // Unexpected errors
            logger.error("Unexpected error fetching custom order by id", {
                id,
                message: err?.message,
                stack: err?.stack
            });
            throw new HttpException(500, "Failed to retrieve custom order");
        }
    }

    async deleteCustomOrder(id: number): Promise<customOrderResponse> {
        try {
            const result = await this.customOrderManagementRepo.deleteCustomOrder(id);

            logAudit("CUSTOM_ORDER_DELETED", { order_id: id });
            logInfo("Custom order deleted successfully", { order_id: id });

            return result;
        } catch (err: any) {
            // Re-throw HttpException as-is
            if (err instanceof HttpException) {
                throw err;
            }

            // Handle Prisma errors
            if (err?.code === "P2025") {
                logger.warn("Custom order not found for deletion", { id });
                throw new HttpException(404, "Custom order not found");
            }

            // Unexpected errors
            logger.error("Unexpected error deleting custom order", {
                id,
                message: err?.message,
                stack: err?.stack
            });
            throw new HttpException(500, "Failed to delete custom order");
        }
    }

    async softDeleteCustomOrder(id: number): Promise<customOrderResponse> {
        try {
            const result = await this.customOrderManagementRepo.softDeleteCustomOrder(id);

            logAudit("CUSTOM_ORDER_SOFT_DELETED", { order_id: id });
            logInfo("Custom order soft deleted successfully", { order_id: id });

            return result;
        } catch (err: any) {
            // Re-throw HttpException as-is
            if (err instanceof HttpException) {
                throw err;
            }

            // Handle Prisma errors
            if (err?.code === "P2025") {
                logger.warn("Custom order not found for soft deletion", { id });
                throw new HttpException(404, "Custom order not found");
            }

            // Unexpected errors
            logger.error("Unexpected error soft deleting custom order", {
                id,
                message: err?.message,
                stack: err?.stack
            });
            throw new HttpException(500, "Failed to soft delete custom order");
        }
    }

    async terimaCustomOrder(id: number, adminId: number, data: terimaCustomOrderRequest): Promise<customOrderResponse> {
        // Validate with Zod schema
        const parsed = validatorCustomOrder.terimaSchema.safeParse(data);
        if (!parsed.success) {
            logger.warn("terimaCustomOrder validation failed", { issues: parsed.error.issues });
            const message = parsed.error.issues
                .map(i => `${i.path.join('.') || '<root>'}: ${i.message}`)
                .join('; ');
            throw new HttpException(400, message);
        }

        try {
            const result = await this.customOrderManagementRepo.terimaCustomOrder(id, adminId);

            logAudit("CUSTOM_ORDER_ACCEPTED", {
                order_id: id,
                admin_id: adminId
            });
            logInfo("Custom order accepted successfully", {
                order_id: id,
                admin_id: adminId
            });

            return result;
        } catch (err: any) {
            // Re-throw HttpException as-is
            if (err instanceof HttpException) {
                throw err;
            }

            // Handle Prisma errors
            if (err?.code === "P2025") {
                logger.warn("Custom order not found for acceptance", { id });
                throw new HttpException(404, "Custom order not found");
            }

            // Unexpected errors
            logger.error("Unexpected error accepting custom order", {
                id,
                admin_id: adminId,
                message: err?.message,
                stack: err?.stack
            });
            throw new HttpException(500, "Failed to accept custom order");
        }
    }

    async tolakCustomOrder(id: number, adminId: number, data: tolakCustomOrderRequest): Promise<customOrderResponse> {
        // Validate with Zod schema
        const parsed = validatorCustomOrder.tolakSchema.safeParse(data);
        if (!parsed.success) {
            logger.warn("tolakCustomOrder validation failed", { issues: parsed.error.issues });
            const message = parsed.error.issues
                .map(i => `${i.path.join('.') || '<root>'}: ${i.message}`)
                .join('; ');
            throw new HttpException(400, message);
        }

        try {
            const result = await this.customOrderManagementRepo.tolakCustomOrder(id, adminId, parsed.data.alasan_ditolak);

            logAudit("CUSTOM_ORDER_REJECTED", {
                order_id: id,
                admin_id: adminId,
                alasan_ditolak: parsed.data.alasan_ditolak
            });
            logInfo("Custom order rejected successfully", {
                order_id: id,
                admin_id: adminId
            });

            return result;
        } catch (err: any) {
            // Re-throw HttpException as-is
            if (err instanceof HttpException) {
                throw err;
            }

            // Handle Prisma errors
            if (err?.code === "P2025") {
                logger.warn("Custom order not found for rejection", { id });
                throw new HttpException(404, "Custom order not found");
            }

            // Unexpected errors
            logger.error("Unexpected error rejecting custom order", {
                id,
                admin_id: adminId,
                message: err?.message,
                stack: err?.stack
            });
            throw new HttpException(500, "Failed to reject custom order");
        }
    }

    async dealNegosiasi(id: number, adminId: number, data: dealNegosiasiRequest): Promise<customOrderResponse> {
        // Validate with Zod schema
        const parsed = validatorCustomOrder.dealNegosiasiSchema.safeParse(data);
        if (!parsed.success) {
            logger.warn("dealNegosiasi validation failed", { issues: parsed.error.issues });
            const message = parsed.error.issues
                .map(i => `${i.path.join('.') || '<root>'}: ${i.message}`)
                .join('; ');
            throw new HttpException(400, message);
        }

        try {
            const result = await this.customOrderManagementRepo.dealNegosiasi(id, adminId, parsed.data.total_harga);

            logAudit("CUSTOM_ORDER_NEGOTIATION_DEAL", {
                order_id: id,
                admin_id: adminId,
                total_harga: parsed.data.total_harga
            });
            logInfo("Custom order negotiation deal completed successfully", {
                order_id: id,
                admin_id: adminId,
                total_harga: parsed.data.total_harga
            });

            return result;
        } catch (err: any) {
            // Re-throw HttpException as-is
            if (err instanceof HttpException) {
                throw err;
            }

            // Handle Prisma errors
            if (err?.code === "P2025") {
                logger.warn("Custom order not found for negotiation", { id });
                throw new HttpException(404, "Custom order not found");
            }

            // Unexpected errors
            logger.error("Unexpected error dealing negotiation", {
                id,
                admin_id: adminId,
                message: err?.message,
                stack: err?.stack
            });
            throw new HttpException(500, "Failed to complete negotiation deal");
        }
    }

    async batalPemesanan(id: number, adminId: number, data: batalPemesananRequest): Promise<customOrderResponse> {
        // Validate with Zod schema
        const parsed = validatorCustomOrder.batalPemesananSchema.safeParse(data);
        if (!parsed.success) {
            logger.warn("batalPemesanan validation failed", { issues: parsed.error.issues });
            const message = parsed.error.issues
                .map(i => `${i.path.join('.') || '<root>'}: ${i.message}`)
                .join('; ');
            throw new HttpException(400, message);
        }

        try {
            const result = await this.customOrderManagementRepo.batalPemesanan(id, adminId, parsed.data.alasan_ditolak ?? undefined);

            logAudit("CUSTOM_ORDER_CANCELLED", {
                order_id: id,
                admin_id: adminId,
                alasan_ditolak: parsed.data.alasan_ditolak
            });
            logInfo("Custom order cancelled successfully", {
                order_id: id,
                admin_id: adminId
            });

            return result;
        } catch (err: any) {
            // Re-throw HttpException as-is
            if (err instanceof HttpException) {
                throw err;
            }

            // Handle Prisma errors
            if (err?.code === "P2025") {
                logger.warn("Custom order not found for cancellation", { id });
                throw new HttpException(404, "Custom order not found");
            }

            // Unexpected errors
            logger.error("Unexpected error cancelling custom order", {
                id,
                admin_id: adminId,
                message: err?.message,
                stack: err?.stack
            });
            throw new HttpException(500, "Failed to cancel custom order");
        }
    }
}

export default new CustomOrderManagement();