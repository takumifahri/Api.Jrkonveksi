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
            const result = await this.modelBajuRepository.getAllModelBaju(params, requester);

            logInfo("Model baju retrieved successfully", {
                count: result.length,
                limit: params?.limit,
                offset: params?.offset
            });

            return result;
        } catch (err: any) {
            // Re-throw HttpException as-is
            if (err instanceof HttpException) {
                throw err;
            }

            // Unexpected errors
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
            const result = await this.modelBajuRepository.getModelBajuById(id);

            // Check if model baju exists
            if (!result) {
                logger.warn("Model baju not found", { id });
                throw new HttpException(404, "Model baju not found");
            }

            logInfo("Model baju retrieved successfully", { id });

            return result;
        } catch (err: any) {
            // Re-throw HttpException as-is (preserve status code)
            if (err instanceof HttpException) {
                throw err;
            }

            // Unexpected errors
            logger.error("Unexpected error fetching model baju by id", {
                id,
                message: err?.message,
                stack: err?.stack
            });
            throw new HttpException(500, "Failed to retrieve model baju");
        }
    }

    async createModelBaju(data: createModelBajuRequest): Promise<modelBajuResponse> {
        // Validate with Zod schema
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

            // Log success dengan audit trail
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
            // Re-throw HttpException as-is (preserve status code)
            if (err instanceof HttpException) {
                throw err;
            }

            // Handle Prisma specific errors
            if (err?.name === "PrismaClientValidationError" || err?.code === "P2021" || err?.code === "P2002") {
                logger.error("Prisma validation error creating model baju", {
                    message: err?.message,
                    code: err?.code
                });
                throw new HttpException(400, err?.message ?? "Invalid data provided");
            }

            // Unexpected errors jadi 500
            logger.error("Unexpected error creating model baju", {
                message: err?.message,
                name: err?.name,
                stack: err?.stack
            });
            throw new HttpException(500, "Failed to create model baju");
        }
    }

    async updateModelBaju(id: number, data: updateModelBajuRequest): Promise<modelBajuResponse> {
        // Validate with Zod schema
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

            logAudit("MODEL_BAJU_UPDATED", { id });
            logInfo("Model baju updated successfully", { id });

            return result;
        } catch (err: any) {
            // Re-throw HttpException as-is
            if (err instanceof HttpException) {
                throw err;
            }

            // Handle Prisma errors
            if (err?.code === "P2025") {
                logger.warn("Model baju not found for update", { id });
                throw new HttpException(404, "Model baju not found");
            }

            // Unexpected errors
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

            logAudit("MODEL_BAJU_DELETED", { id });
            logInfo("Model baju deleted successfully", { id });

            return result;
        } catch (err: any) {
            // Re-throw HttpException as-is
            if (err instanceof HttpException) {
                throw err;
            }

            // Handle Prisma errors
            if (err?.code === "P2025") {
                logger.warn("Model baju not found for deletion", { id });
                throw new HttpException(404, "Model baju not found");
            }

            // Unexpected errors
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

            logAudit("MODEL_BAJU_SOFT_DELETED", { id });
            logInfo("Model baju soft deleted successfully", { id });

            return result;
        } catch (err: any) {
            // Re-throw HttpException as-is
            if (err instanceof HttpException) {
                throw err;
            }

            // Handle Prisma errors
            if (err?.code === "P2025") {
                logger.warn("Model baju not found for soft deletion", { id });
                throw new HttpException(404, "Model baju not found");
            }

            // Unexpected errors
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