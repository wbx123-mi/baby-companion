import type { GrowthRecordContract, GrowthRecordFlowerContract, GrowthRecordPageContract } from "@baby-companion/contracts";
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
    assets: record.assets.map((asset) => ({ ...asset, url: asset.accessUrl, localPath: null })),
    status: "ACTIVE",
  };
}

function createClientRequestId(): string {
  return `record_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

export const recordsApi = {
  async listPage(babyId: string, filters: RecordFilters, cursor?: string): Promise<Omit<GrowthRecordPageContract, "items"> & { items: GrowthRecord[] }> {
    const query = [
      `babyId=${encodeURIComponent(babyId)}`,
      ...(filters.type ? [`type=${encodeURIComponent(filters.type)}`] : []),
      ...(filters.month ? [`month=${encodeURIComponent(filters.month)}`] : []),
      ...(cursor ? [`cursor=${encodeURIComponent(cursor)}`] : []),
    ].join("&");
    const page = await authenticatedRequest<GrowthRecordPageContract>({ path: `/records/page?${query}` });
    return { ...page, items: page.items.map(toGrowthRecord) };
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
        assetIds: input.assets.map((asset) => asset.id),
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
        assetIds: input.assets.map((asset) => asset.id),
      },
    }));
  },

  delete(recordId: string, version: number): Promise<null> {
    return authenticatedRequest({ path: `/records/${recordId}`, method: "DELETE", data: { version } });
  },

  sendFlower(recordId: string): Promise<GrowthRecordFlowerContract> {
    return authenticatedRequest({ path: `/records/${recordId}/flowers`, method: "POST" });
  },
};
