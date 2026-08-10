import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: {
    actorId?: string;
    action: string;
    subject?: string;
    payload?: Record<string, unknown>;
    ipHash?: string;
  }) {
    return this.prisma.auditEvent.create({
      data: {
        actorId: input.actorId,
        action: input.action,
        subject: input.subject,
        payload: input.payload as Prisma.InputJsonValue | undefined,
        ipHash: input.ipHash,
      },
    });
  }
}
