import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client";
import { parseMariaDbUrl } from "./database-url";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(configService: ConfigService) {
    const connectionOptions = parseMariaDbUrl(configService.getOrThrow<string>("DATABASE_URL"));
    super({
      adapter: new PrismaMariaDb(connectionOptions),
      transactionOptions: {
        maxWait: 10_000,
        timeout: 10_000,
      },
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
