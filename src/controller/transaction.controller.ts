import transactionService from "../services/transaction.service.js";
import type { Request, Response, NextFunction } from "express";
import HttpException from "../utils/HttpExecption.js";

const createTransaction = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const payload = req.body;
        const transaction = await transactionService.createTransaction(payload);
        res.status(201).json({
            message: "Transaction created successfully",
            data: transaction
        });
    }
    catch (err: any) {
        if (err instanceof HttpException) return res.status(err.status).json({ message: err.message });
        next(err);
    }
};

const getTransactionById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const transactionId = Number(req.params.id);
        
        const transaction = await transactionService.getTransactionById(transactionId);
        if (!transaction) {
            return res.status(404).json({
                message: "Transaction not found"
            });
        }
        res.status(200).json({
            message: "Transaction retrieved successfully",
            data: transaction
        });
    }
    catch (err: any) {
        if (err instanceof HttpException) return res.status(err.status).json({ message: err.message });
        next(err);
    }
};

const getAllTransactions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const transactions = await transactionService.getAllTransactions();
        if (!transactions || transactions.length === 0) {
            return res.status(404).json({
                message: "No transactions found"
            });
        }
        res.status(200).json({
            message: "Transactions retrieved successfully",
            data: transactions
        });
    }
    catch (err: any) {
        if (err instanceof HttpException) return res.status(err.status).json({ message: err.message });
        next(err);
    }
};

const deleteTransaction = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const transactionId = Number(req.params.id);
        await transactionService.deleteTransaction(transactionId);  
        res.status(200).json({
            message: "Transaction deleted successfully"
        });
    }
    catch (err: any) {
        if (err instanceof HttpException) return res.status(err.status).json({ message: err.message });
        next(err);
    }
};

const softDeleteTransaction = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const transactionId = Number(req.params.id);   
        if (!transactionId || isNaN(transactionId)) {
            return res.status(400).json({ message: "Invalid transaction ID" });
        }
        if (transactionId <= 0) {
            return res.status(400).json({ message: "Transaction ID must be a positive number" });
        } 
        await transactionService.softDeleteTransaction(transactionId);  
        res.status(200).json({
            message: "Transaction soft deleted successfully"
        });
    }
    catch (err: any) {
        if (err instanceof HttpException) return res.status(err.status).json({ message: err.message });
        next(err);
    }
};

const updateTransaction = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const transactionId = Number(req.params.id);
        const payload = req.body;
        const updatedTransaction = await transactionService.updateTransaction(transactionId, payload);
        res.status(200).json({
            message: "Transaction updated successfully",
            data: updatedTransaction
        });
    }
    catch (err: any) {
        if (err instanceof HttpException) return res.status(err.status).json({ message: err.message });
        next(err);
    }
};

const terimaPembayaran = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const transactionId = Number(req.params.id);
        const payload = req.body;
        const adminId = req.user?.id;
        const updatedTransaction = await transactionService.terimaPembayaran(transactionId, payload, adminId!);
        res.status(200).json({
            message: "Payment accepted successfully",
            data: updatedTransaction
        });
    } catch (err: any) {
        if (err instanceof HttpException) return res.status(err.status).json({ message: err.message });
        next(err);
    }
};

const tolakPembayaran = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const transactionId = Number(req.params.id);
        const payload = req.body;
        const adminId = req.user?.id;
        const updatedTransaction = await transactionService.tolakPembayaran(transactionId, payload, adminId!);
        res.status(200).json({
            message: "Payment rejected successfully",
            data: updatedTransaction
        });
    } catch (err: any) {
        if (err instanceof HttpException) return res.status(err.status).json({ message: err.message });
        next(err);
    }
};

const bayarPesananan = async (req: Request, res: Response, next: NextFunction) => {  
    try {
        const transactionId = Number(req.params.id);
        const payload = req.body;
        const userId = req.user?.id;
        const updatedTransaction = await transactionService.bayarPesananan(transactionId, payload, userId!);
        res.status(200).json({
            message: "Payment submitted successfully",
            data: updatedTransaction
        });
    } catch (err: any) {
        if (err instanceof HttpException) return res.status(err.status).json({ message: err.message });
        next(err);
    }
};

const resendPembayaran = async (req: Request, res: Response, next: NextFunction) => {  
    try {
        const transactionId = Number(req.params.id);
        const payload = req.body;
        const userId = req.user?.id;
        const updatedTransaction = await transactionService.resendPembayaran(transactionId, payload, userId!);
        res.status(200).json({
            message: "Payment resend successfully",
            data: updatedTransaction
        });
    }
    catch (err: any) {
        if (err instanceof HttpException) return res.status(err.status).json({ message: err.message });
        next(err);
    }
};

const TransactionController = {
    createTransaction,
    getTransactionById,
    getAllTransactions,
    deleteTransaction,
    softDeleteTransaction,
    updateTransaction,
    terimaPembayaran,
    tolakPembayaran,
    bayarPesananan,
    resendPembayaran
};
export default TransactionController;