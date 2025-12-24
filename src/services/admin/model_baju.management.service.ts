import logger, { logInfo, logError, logWarn, logAudit } from "../../utils/logger.js";
import HttpException from "../../utils/HttpExecption.js";
import validatorModelBaju from "../../middleware/validaator/model_baju.validator.js";
import type {
    createModelBajuRequest,
    IModelBajuInterface,
    modelBajuResponse,
    updateModelBajuRequest
} from "../../interfaces/model_baju.interface.js";
import { ModelBajuRepository } from "../../repository/admin/model_baju.repository.js";
import type { Requester } from "../../interfaces/auth.interface.js";
import CacheService, { CACHE_TTL } from "../cache.service.js";

class ModelBajuManagementService implements IModelBajuInterface {
    private modelBajuRepository = new ModelBajuRepository();
    
    async getAllModelBaju(
        params?: {
            q?: string | null;
            limit?: number;
            offset?: number;
            sortBy?: string | null;
            sortOrder?: "asc" | "desc";
        },
        requester?: Requester
    ): Promise<modelBajuResponse[]> {
        try {
            // ✅ Generate cache key
            const cacheKey = `model_baju:all:${JSON.stringify(params)}`;
            const cached = CacheService.get<modelBajuResponse[]>(cacheKey);
            
            if (cached) {
                logInfo("Model baju retrieved from cache", { count: cached.length });
                return cached;
            }

            const result = await this.modelBajuRepository.getAllModelBaju(params, requester);

            // ✅ Cache for 15 minutes (rarely changes)
            CacheService.set(cacheKey, result, CACHE_TTL.MODERATE.MODEL_BAJU_LIST);

            logInfo("Model baju retrieved from database and cached", {
                count: result.length,
                limit: params?.limit,
                offset: params?.offset
            });

            return result;
        } catch (err: any) {
            if (err instanceof HttpException) {
                throw err;
            }

            logger.error("Unexpected error fetching model baju", {
                message: err?.message,
                stack: err?.stack,
                params
            });
            throw new HttpException(500, "Failed to retrieve model baju");
        }
    }

    async getModelBajuById(id: number): Promise<modelBajuResponse> {
        try {
            // ✅ Try cache first
            const cacheKey = `model_baju:${id}`;
            const cached = CacheService.get<modelBajuResponse>(cacheKey);
            
            if (cached) {
                logInfo("Model baju retrieved from cache", { id });
                return cached;
            }

            const result = await this.modelBajuRepository.getModelBajuById(id);

            if (!result) {
                logger.warn("Model baju not found", { id });
                throw new HttpException(404, "Model baju not found");
            }

            // ✅ Cache for 15 minutes
            CacheService.set(cacheKey, result, CACHE_TTL.MODERATE.MODEL_BAJU_LIST);

            logInfo("Model baju retrieved from database and cached", { id });
            return result;
        } catch (err: any) {
            if (err instanceof HttpException) {
                throw err;
            }

            logger.error("Unexpected error fetching model baju by id", {
                id,
                message: err?.message,
                stack: err?.stack
            });
            throw new HttpException(500, "Failed to retrieve model baju");
        }
    }

    async createModelBaju(data: createModelBajuRequest): Promise<modelBajuResponse> {
        const parsed = validatorModelBaju.createSchema.safeParse(data);
        if (!parsed.success) {
            logger.warn("createModelBaju validation failed", { issues: parsed.error.issues });
            const message = parsed.error.issues
                .map(i => `${i.path.join('.') || '<root>'}: ${i.message}`)
                .join('; ');
            throw new HttpException(400, message);
        }

        try {
            const result = await this.modelBajuRepository.createModelBaju(parsed.data as createModelBajuRequest);

            // ✅ Invalidate list caches
            CacheService.deletePattern('model_baju:all');

            logAudit("MODEL_BAJU_CREATED", {
                id: result.id,
                nama_model: result.nama
            });

            logInfo("Model baju created successfully", {
                id: result.id,
                nama_model: result.nama
            });

            return result;
        } catch (err: any) {
            if (err instanceof HttpException) {
                throw err;
            }

            if (err?.name === "PrismaClientValidationError" || err?.code === "P2021" || err?.code === "P2002") {
                logger.error("Prisma validation error creating model baju", {
                    message: err?.message,
                    code: err?.code
                });
                throw new HttpException(400, err?.message ?? "Invalid data provided");
            }

            logger.error("Unexpected error creating model baju", {
                message: err?.message,
                name: err?.name,
                stack: err?.stack
            });
            throw new HttpException(500, "Failed to create model baju");
        }
    }

    async updateModelBaju(id: number, data: updateModelBajuRequest): Promise<modelBajuResponse> {
        const parsed = validatorModelBaju.updateSchema.safeParse(data);
        if (!parsed.success) {
            logger.warn("updateModelBaju validation failed", { issues: parsed.error.issues });
            const message = parsed.error.issues
                .map(i => `${i.path.join('.') || '<root>'}: ${i.message}`)
                .join('; ');
            throw new HttpException(400, message);
        }

        try {
            const result = await this.modelBajuRepository.updateModelBaju(id, parsed.data as updateModelBajuRequest);

            if (!result) {
                logger.warn("Model baju not found after update", { id });
                throw new HttpException(404, "Model baju not found");
            }

            // ✅ Invalidate caches
            CacheService.delete(`model_baju:${id}`);
            CacheService.deletePattern('model_baju:all');

            logAudit("MODEL_BAJU_UPDATED", { id });
            logInfo("Model baju updated successfully", { id });

            return result;
        } catch (err: any) {
            if (err instanceof HttpException) {
                throw err;
            }

            if (err?.code === "P2025") {
                logger.warn("Model baju not found for update", { id });
                throw new HttpException(404, "Model baju not found");
            }

            logger.error("Unexpected error updating model baju", {
                id,
                message: err?.message,
                stack: err?.stack
            });
            throw new HttpException(500, "Failed to update model baju");
        }
    }

    async deleteModelBaju(id: number): Promise<modelBajuResponse> {
        try {
            const result = await this.modelBajuRepository.deleteModelBaju(id);

            if (!result) {
                logger.warn("Model baju not found for deletion", { id });
                throw new HttpException(404, "Model baju not found");
            }

            // ✅ Invalidate caches
            CacheService.delete(`model_baju:${id}`);
            CacheService.deletePattern('model_baju:all');

            logAudit("MODEL_BAJU_DELETED", { id });
            logInfo("Model baju deleted successfully", { id });

            return result;
        } catch (err: any) {
            if (err instanceof HttpException) {
                throw err;
            }

            if (err?.code === "P2025") {
                logger.warn("Model baju not found for deletion", { id });
                throw new HttpException(404, "Model baju not found");
            }

            logger.error("Unexpected error deleting model baju", {
                id,
                message: err?.message,
                stack: err?.stack
            });
            throw new HttpException(500, "Failed to delete model baju");
        }
    }

    async softDeleteModelBaju(id: number): Promise<modelBajuResponse> {
        try {
            const result = await this.modelBajuRepository.softDeleteModelBaju(id);

            if (!result) {
                logger.warn("Model baju not found for soft deletion", { id });
                throw new HttpException(404, "Model baju not found");
            }

            // ✅ Invalidate caches
            CacheService.delete(`model_baju:${id}`);
            CacheService.deletePattern('model_baju:all');

            logAudit("MODEL_BAJU_SOFT_DELETED", { id });
            logInfo("Model baju soft deleted successfully", { id });

            return result;
        } catch (err: any) {
            if (err instanceof HttpException) {
                throw err;
            }

            if (err?.code === "P2025") {
                logger.warn("Model baju not found for soft deletion", { id });
                throw new HttpException(404, "Model baju not found");
            }

            logger.error("Unexpected error soft deleting model baju", {
                id,
                message: err?.message,
                stack: err?.stack
            });
            throw new HttpException(500, "Failed to soft delete model baju");
        }
    }
}

export default new ModelBajuManagementService();