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
    ICustomOrderInterface
} from "../../interfaces/custom_order.interface.js";

import { CustomOrderRepository } from "../../repository/custom_order.repository.js";
import type { Requester } from "../../interfaces/auth.interface.js";
import MailerService from "../mailer.service.js";
import { prisma } from "../../config/prisma.config.js";

export class CustomOrderService implements ICustomOrderInterface {
    private customOrderRepo = new CustomOrderRepository();

    async ajuanCustomOrder(data: createCustomOrderRequest): Promise<customOrderResponse> {
        // ✅ Validate user_id
        if (!data.user_id) {
            logger.warn("pengajuanCustomorder called without user_id");
            throw new HttpException(400, "user_id is required");
        }

        // ✅ Validate with Zod schema
        const parsed = validatorCustomOrder.createSchema.safeParse(data);
        if (!parsed.success) {
            logger.warn("pengajuanCustomorder validation failed", { issues: parsed.error.issues });
            const message = parsed.error.issues
                .map(i => `${i.path.join('.') || '<root>'}: ${i.message}`)
                .join('; ');
            throw new HttpException(400, message);
        }

        // ✅ Business logic validation - Material
        if (data.material_sendiri === true) {
            parsed.data.material_id = null;
        } else if (data.material_sendiri === false && !data.material_id) {
            logger.warn("pengajuanCustomorder called with material_sendiri false but no material_id");
            throw new HttpException(400, "material_id is required when material_sendiri is false");
        }

        // ✅ Business logic validation - File referensi
        if (data.referensi_custom === true) {
            if (!data.file_referensi_custom || data.file_referensi_custom.length === 0) {
                logger.warn("pengajuanCustomorder called with referensi_custom true but no file_referensi_custom");
                throw new HttpException(400, "file_referensi_custom is required when referensi_custom is true");
            }
        } else if (data.referensi_custom === false) {
            parsed.data.file_referensi_custom = null;
            if (!data.model_baju_id) {
                logger.warn("pengajuanCustomorder called with referensi_custom false but no model_baju_id");
                throw new HttpException(400, "model_baju_id is required when referensi_custom is false");
            }
        }

        try {
            const result = await this.customOrderRepo.ajuanCustomOrder(parsed.data as createCustomOrderRequest);

            // ✅ Log success dengan audit trail
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

            // ✅ Send email notification to admin (moved to MailerService)
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
            // ✅ Re-throw HttpException as-is (preserve status code)
            if (err instanceof HttpException) {
                throw err;
            }

            // ✅ Handle Prisma specific errors
            if (err?.name === "PrismaClientValidationError" || err?.code === "P2021" || err?.code === "P2002") {
                logger.error("Prisma validation error creating custom order", {
                    message: err?.message,
                    code: err?.code
                });
                throw new HttpException(400, err?.message ?? "Invalid data provided");
            }

            // ✅ Unexpected errors jadi 500
            logger.error("Unexpected error creating custom order", {
                message: err?.message,
                name: err?.name,
                stack: err?.stack
            });
            throw new HttpException(500, "Failed to create custom order");
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

            // ✅ Search filter
            if (params?.q) {
                const q = String(params.q).trim();
                where.OR = [
                    { nama_pemesanan: { contains: q, mode: "insensitive" } },
                    { unique_id: { contains: q, mode: "insensitive" } },
                    { warna: { contains: q, mode: "insensitive" } }
                ];
            }

            // ✅ Access control: batasi untuk user non-admin
            const role = requester?.role ?? "User";
            if (requester && role !== "Admin" && role !== "Manager") {
                where.user_id = requester.id;
            }

            // ✅ Pagination
            const page = params?.page && params.page > 0 ? Math.floor(params.page) : 1;
            const limit = params?.limit && params.limit > 0 ? Math.floor(params.limit) : 25;
            const skip = (page - 1) * limit;

            // ✅ Sorting
            const sortBy = params?.sortBy || "createdAt";
            const sortOrder: "asc" | "desc" = params?.sortOrder || "desc";

            const orders = await this.customOrderRepo.findCustomOrder({
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
            // ✅ Re-throw HttpException as-is
            if (err instanceof HttpException) {
                throw err;
            }

            // ✅ Unexpected errors
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
            const order = await this.customOrderRepo.getCustomOrderById(id);

            // ✅ Check if order exists
            if (!order) {
                logger.warn("Custom order not found", { id });
                throw new HttpException(404, "Custom order not found");
            }

            logInfo("Custom order retrieved successfully", { order_id: id });
            return order;
        } catch (err: any) {
            // ✅ Re-throw HttpException as-is (preserve status code)
            if (err instanceof HttpException) {
                throw err;
            }

            // ✅ Unexpected errors
            logger.error("Unexpected error fetching custom order by id", {
                id,
                message: err?.message,
                stack: err?.stack
            });
            throw new HttpException(500, "Failed to retrieve custom order");
        }
    }

}

export default new CustomOrderService();