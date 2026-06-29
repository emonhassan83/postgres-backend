import { Prisma } from "@prisma/client";
import { PrismaClientKnownRequestError, PrismaClientValidationError } from "@prisma/client/runtime/library";
import { Socket } from "socket.io";

import { TAckFn } from "../interface/socket.interface";

import ackHandler from "./ackHandler";

import ApiError from "@/app/errors/ApiError";

/**
 * Handles all types of errors in Socket.io events with proper status codes and messages
 * Designed to use the Prisma client errors
 */
export const handleSocketError = (err: any, socket: Socket, ack?: TAckFn) => {
  let status = 500;
  let message = "Something went wrong!";
  let error = err;

  // ==================== Prisma Client Errors ====================
  if (err instanceof PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      status = 409;
      const fields = (err.meta?.target as string[])?.join(', ') || 'field';
      message = `${fields} already exists!`;
      error = {
        message,
        fields,
        code: "duplicate_key",
      };
    } else if (err.code === "P2025") {
      status = 404;
      message = "Record not found!";
      error = {
        message,
        code: "not_found",
      };
    } else {
      status = 400;
      message = err.message;
      error = {
        message,
        code: err.code,
      };
    }
  }

  else if (err instanceof PrismaClientValidationError) {
    status = 422;
    message = "Validation error!";
    error = {
      message: err.message,
      code: "validation_error",
    };
  }

  // ==================== Custom ApiError ====================
  else if (err instanceof ApiError) {
    status = err.code;
    message = err.message;
    error = err;
  }

  // ==================== JWT Authentication Errors ====================
  else if (err.name === "JsonWebTokenError") {
    status = 401;
    message = "Invalid token!";
  } else if (err.name === "TokenExpiredError") {
    status = 401;
    message = "Token has expired!";
  }

  // ==================== Fallback for any other Error ====================
  else if (err instanceof Error) {
    message = err.message || message;
  }

  // ==================== Send Response to Client ====================
  if (ack) {
    ackHandler(ack, { success: false, message, status });
  }

  socket.emit("socketError", {
    success: false,
    status,
    message,
    error: error instanceof Error ? error.message : error,
  });

  // Log error for debugging
  console.error("[Socket Error]:", {
    status,
    message,
    originalError: err,
  });
};