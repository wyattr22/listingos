import { prisma } from "./prisma.js";

export async function logApiEvent(input: {
  userId?: string | null;
  endpoint: string;
  method: string;
  statusCode?: number;
  success: boolean;
  message?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await prisma.apiLog.create({
      data: {
        userId: input.userId || null,
        endpoint: input.endpoint,
        method: input.method,
        statusCode: input.statusCode,
        success: input.success,
        message: input.message,
        metadata: input.metadata ?? null,
      },
    });
  } catch (error) {
    console.error("Failed to write ApiLog", error);
  }
}
