import type { GrowthRecordContract } from "@baby-companion/contracts";
import { authenticatedRequest } from "./auth-api";
import type { GrowthRecord, RecordFilters, SaveRecordInput } from "@/types/domain";

function toGrowthRecord(record: GrowthRecordContract): GrowthRecord {
  return {
    ...record,
    creator: {
      id: record.creator.id,
      nickname: record.creator.nickname || "家人",
      avatarUrl: record.creator.avatarUrl,
    },
    assets: [],
    status: "ACTIVE",
  };
}

function createClientRequestId(): string {
  return `record_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

export const recordsApi = {
  async list(babyId: string, filters: RecordFilters): Promise<GrowthRecord[]> {
    const query = [
      `babyId=${encodeURIComponent(babyId)}`,
      ...(filters.type ? [`type=${encodeURIComponent(filters.type)}`] : []),
      ...(filters.month ? [`month=${encodeURIComponent(filters.month)}`] : []),
    ].join("&");
    const records = await authenticatedRequest<GrowthRecordContract[]>({ path: `/records?${query}` });
    return records.map(toGrowthRecord);
  },

  async get(recordId: string): Promise<GrowthRecord> {
    return toGrowthRecord(await authenticatedRequest<GrowthRecordContract>({ path: `/records/${recordId}` }));
  },

  async create(babyId: string, input: SaveRecordInput): Promise<GrowthRecord> {
    return toGrowthRecord(await authenticatedRequest<GrowthRecordContract>({
      path: "/records",
      method: "POST",
      data: {
        babyId,
        type: input.type,
        content: input.content,
        occurredAt: input.occurredAt,
        clientRequestId: createClientRequestId(),
      },
    }));
  },

  async update(recordId: string, input: SaveRecordInput): Promise<GrowthRecord> {
    return toGrowthRecord(await authenticatedRequest<GrowthRecordContract>({
      path: `/records/${recordId}`,
      method: "PUT",
      data: {
        type: input.type,
        content: input.content,
        occurredAt: input.occurredAt,
        version: input.version,
      },
    }));
  },

  delete(recordId: string, version: number): Promise<null> {
    return authenticatedRequest({ path: `/records/${recordId}`, method: "DELETE", data: { version } });
  },
};
