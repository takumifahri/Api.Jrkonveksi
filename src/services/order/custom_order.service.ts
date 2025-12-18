import logger from "../../utils/logger.js";
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
    ICustomOrderRepository
} from "../../interfaces/custom_order.interface.js";

import { CustomOrderRepository } from "../../repository/custom_order.repository.js";
import type { Requester } from "../../interfaces/auth.interface.js";

export class CustomOrderService implements ICustomOrderRepository {
    private customOrderRepo = new CustomOrderRepository();

    async createCustomOrder(data: createCustomOrderRequest): Promise<customOrderResponse> {
        if (!data.user_id) {
            logger.warn("createCustomOrder called without user_id");
            throw new HttpException(400, "user_id is required");
        }
        const parsed = validatorCustomOrder.createSchema.safeParse(data);
        if (!parsed.success) {
            logger.warn("createCustomOrder validation failed", { issues: parsed.error.issues });
            const message = parsed.error.issues
                .map(i => `${i.path.join('.') || '<root>'}: ${i.message}`)
                .join('; ');
            throw new HttpException(400, message);
        }
        try {
            if (data.material_sendiri === true) {
                parsed.data.material_id = null;
            } else if (data.material_sendiri === false && !data.material_id) {
                logger.warn("createCustomOrder called with material_sendiri false but no material_id");
                throw new HttpException(400, "material is required when material_sendiri is false");
            }

            return await this.customOrderRepo.createCustomOrder(parsed.data as createCustomOrderRequest);
        } catch (err: any) {
            logger.error("Error creating custom order", { message: err?.message, name: err?.name, stack: err?.stack });
            if (err?.name === "PrismaClientValidationError" || err?.code === "P2021" || err?.code === "P2002") {
                throw new HttpException(400, err?.message ?? String(err));
            }
            throw new HttpException(500, err?.message ?? String(err));
        }
    }

    async updateCustomOrder(id: number, data: updateCustomOrderRequest): Promise<customOrderResponse> {
        const parsed = validatorCustomOrder.updateSchema.safeParse(data);
        if (!parsed.success) {
            logger.warn("updateCustomOrder validation failed", { issues: parsed.error.issues });
            const message = parsed.error.issues
                .map(i => `${i.path.join('.') || '<root>'}: ${i.message}`)
                .join('; ');
            throw new HttpException(400, message);
        }
        try {
            return await this.customOrderRepo.updateCustomOrder(id, parsed.data as updateCustomOrderRequest);
        } catch (err) {
            logger.error("Error updating custom order", { id, error: err });
            throw new HttpException(500, "Internal server error");
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
            if (params?.q) {
                const q = String(params.q).trim();
                where.OR = [
                    { nama_pemesanan: { contains: q, mode: "insensitive" } },
                    { unique_id: { contains: q, mode: "insensitive" } },
                    { warna: { contains: q, mode: "insensitive" } }
                ];
            }

            // akses control: batasi untuk user non-admin
            const role = requester?.role ?? "User";
            if (requester && role !== "Admin" && role !== "Manager") {
                where.user_id = requester.id;
            }

            const page = params?.page && params.page > 0 ? Math.floor(params.page) : 1;
            const limit = params?.limit && params.limit > 0 ? Math.floor(params.limit) : 25;
            const skip = (page - 1) * limit;
            const sortBy = params?.sortBy || "createdAt";
            const sortOrder: "asc" | "desc" = params?.sortOrder || "desc";

            const orders = await this.customOrderRepo.findCustomOrder({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder } as any
            });

            return orders;
        } catch (err: any) {
            const message = err?.message ?? String(err);
            logger.error("Error fetching custom orders", { message, stack: err?.stack, params });
            throw new HttpException(500, "Internal server error");
        }
    }

    async getCustomOrderById(id: number): Promise<customOrderResponse> {
        try {
            const order = await this.customOrderRepo.getCustomOrderById(id);
            if (!order) throw new HttpException(404, "Custom order not found");
            return order;
        } catch (err) {
            logger.error("Error fetching custom order by id", { id, error: err });
            if (err instanceof HttpException) throw err;
            throw new HttpException(500, "Internal server error");
        }
    }

    async deleteCustomOrder(id: number): Promise<customOrderResponse> {
        try {
            return await this.customOrderRepo.deleteCustomOrder(id);
        } catch (err) {
            logger.error("Error deleting custom order", { id, error: err });
            throw new HttpException(500, "Internal server error");
        }
    }

    async softDeleteCustomOrder(id: number): Promise<customOrderResponse> {
        try {
            return await this.customOrderRepo.softDeleteCustomOrder(id);
        } catch (err) {
            logger.error("Error soft deleting custom order", { id, error: err });
            throw new HttpException(500, "Internal server error");
        }
    }

    async terimaCustomOrder(id: number, adminId: number, data: terimaCustomOrderRequest): Promise<customOrderResponse> {
        const parsed = validatorCustomOrder.terimaSchema.safeParse(data);
        if (!parsed.success) {
            logger.warn("terimaCustomOrder validation failed", { issues: parsed.error.issues });
            const message = parsed.error.issues
                .map(i => `${i.path.join('.') || '<root>'}: ${i.message}`)
                .join('; ');
            throw new HttpException(400, message);
        }
        try {
            return await this.customOrderRepo.terimaCustomOrder(id, adminId);
        } catch (err) {
            logger.error("Error accepting custom order", { id, error: err });
            throw new HttpException(500, "Internal server error");
        }
    }

    async tolakCustomOrder(id: number, adminId: number, data: tolakCustomOrderRequest): Promise<customOrderResponse> {
        const parsed = validatorCustomOrder.tolakSchema.safeParse(data);
        if (!parsed.success) {
            logger.warn("tolakCustomOrder validation failed", { issues: parsed.error.issues });
            const message = parsed.error.issues
                .map(i => `${i.path.join('.') || '<root>'}: ${i.message}`)
                .join('; ');
            throw new HttpException(400, message);
        }
        try {
            return await this.customOrderRepo.tolakCustomOrder(id, adminId, parsed.data.alasan_ditolak);
        } catch (err) {
            logger.error("Error rejecting custom order", { id, error: err });
            throw new HttpException(500, "Internal server error");
        }
    }

    async dealNegosiasi(id: number, adminId: number, data: dealNegosiasiRequest): Promise<customOrderResponse> {
        const parsed = validatorCustomOrder.dealNegosiasiSchema.safeParse(data);
        if (!parsed.success) {
            logger.warn("dealNegosiasi validation failed", { issues: parsed.error.issues });
            const message = parsed.error.issues
                .map(i => `${i.path.join('.') || '<root>'}: ${i.message}`)
                .join('; ');
            throw new HttpException(400, message);
        }
        try {
            return await this.customOrderRepo.dealNegosiasi(id, adminId, parsed.data.total_harga);
        } catch (err) {
            logger.error("Error dealing negotiation", { id, error: err });
            throw new HttpException(500, "Internal server error");
        }
    }

    async batalPemesanan(id: number, adminId: number, data: batalPemesananRequest): Promise<customOrderResponse> {
        const parsed = validatorCustomOrder.batalPemesananSchema.safeParse(data);
        if (!parsed.success) {
            logger.warn("batalPemesanan validation failed", { issues: parsed.error.issues });
            const message = parsed.error.issues
                .map(i => `${i.path.join('.') || '<root>'}: ${i.message}`)
                .join('; ');
            throw new HttpException(400, message);
        }
        try {
            return await this.customOrderRepo.batalPemesanan(id, adminId, parsed.data.alasan_ditolak ?? undefined);
        } catch (err) {
            logger.error("Error cancelling custom order", { id, error: err });
            throw new HttpException(500, "Internal server error");
        }
    }
}

export default new CustomOrderService();