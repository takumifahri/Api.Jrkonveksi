import type { Request, Response, NextFunction } from "express";
import userManagementService from "../../services/admin/user.management.service.js";

const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const users = await userManagementService.getAllUsers();
        res.status(200).json({
            message: "Users retrieved successfully",
            data: users
        });
    } catch (error) {
        next(error);
    }
    
}

const getUserById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await userManagementService.getUserById(Number(req.params.id));
        res.status(200).json({
            message: "User retrieved successfully",
            data: user
        });
    } catch (error) {
        next(error);
    }

}

const createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await userManagementService.createUser(req.body);
        res.status(201).json({
            message: "User created successfully",
            data: user
        });
    } catch (error) {
        next(error);
    }
}

const updateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await userManagementService.updateUser(Number(req.params.id), req.body);
        res.status(200).json({
            message: "User updated successfully",
            data: user
        });
    } catch (error) {
        next(error);
    }
}

const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await userManagementService.deleteUser(Number(req.params.id));
        res.status(200).json({
            message: "User deleted successfully",
            data: result
        });
    } catch (error) {
        next(error);
    }
}

const softDeleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await userManagementService.softDeleteUser(Number(req.params.id));
        res.status(200).json({
            message: "User soft deleted successfully",
            data: result
        });
    } catch (error) {
        next(error);
    }
}

const blockUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await userManagementService.blockUser(Number(req.params.id));
        res.status(200).json({
            message: "User blocked successfully",
            data: user
        });
    } catch (error) {
        next(error);
    }
}

const unblockUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await userManagementService.unblockUser(Number(req.params.id));
        res.status(200).json({
            message: "User unblocked successfully",
            data: user
        });
    } catch(error) {
        next(error)
    }
}   

const adminUsersController = {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    softDeleteUser,
    
    blockUser,
    unblockUser
};

export default adminUsersController;