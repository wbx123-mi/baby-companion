import type {
  ApiSuccess,
  Baby,
  BootstrapData,
  Family,
  GrowthRecord,
  MediaAsset,
  MockDatabase,
  OnboardingInput,
  RecordFilters,
  SaveRecordInput,
  UpdateBabyInput,
} from "@/types/domain";
import { MockApiError } from "@/types/domain";
import { createMockId, createRequestId } from "@/utils/id";
import { formatMonthKey } from "@/utils/date";
import { readMockDatabase, resetMockDatabase, writeMockDatabase } from "./mock-db";

let runtimeDatabase: MockDatabase = readMockDatabase();

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

async function delay(): Promise<void> {
  const duration = 180 + Math.floor(Math.random() * 170);
  await new Promise((resolve) => setTimeout(resolve, duration));
}

async function success<T>(data: T): Promise<ApiSuccess<T>> {
  await delay();
  return { data: clone(data), requestId: createRequestId() };
}

function persist(): void {
  writeMockDatabase(runtimeDatabase);
}

function requireBaby(): Baby {
  if (!runtimeDatabase.baby) {
    throw new MockApiError("BABY_NOT_FOUND", "暂时没有可用的宝宝档案");
  }
  return runtimeDatabase.baby;
}

export const mockApi = {
  async bootstrap(): Promise<ApiSuccess<BootstrapData>> {
    const baby = runtimeDatabase.baby;
    const family = runtimeDatabase.families[0];
    const nextAction = !family || !baby ? "NO_FAMILY" : "ENTER_APP";

    return success({
      user: runtimeDatabase.user,
      families: runtimeDatabase.families,
      baby,
      currentContext:
        family && baby ? { familyId: family.id, babyId: baby.id } : null,
      nextAction,
    });
  },

  async listRecords(filters: RecordFilters = {}): Promise<ApiSuccess<GrowthRecord[]>> {
    const baby = requireBaby();
    const records = runtimeDatabase.records
      .filter((record) => record.babyId === baby.id)
      .filter((record) => !filters.type || record.type === filters.type)
      .filter((record) => !filters.month || formatMonthKey(record.occurredAt) === filters.month)
      .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt));

    return success(records);
  },

  async getRecord(recordId: string): Promise<ApiSuccess<GrowthRecord>> {
    const record = runtimeDatabase.records.find((item) => item.id === recordId);
    if (!record) {
      throw new MockApiError("RECORD_NOT_FOUND", "这条成长记录不存在或已删除");
    }
    return success(record);
  },

  async createRecord(input: SaveRecordInput): Promise<ApiSuccess<GrowthRecord>> {
    const baby = requireBaby();
    const family = runtimeDatabase.families[0];
    if (!family) {
      throw new MockApiError("FAMILY_NOT_FOUND", "家庭信息不存在");
    }

    const timestamp = new Date().toISOString();
    const record: GrowthRecord = {
      id: createMockId("rec"),
      familyId: family.id,
      babyId: baby.id,
      type: input.type,
      content: input.content.trim(),
      occurredAt: input.occurredAt,
      creator: {
        id: runtimeDatabase.user.id,
        nickname: runtimeDatabase.user.nickname || "家人",
        avatarUrl: runtimeDatabase.user.avatarUrl,
      },
      assets: input.assets.map((asset, index) => ({ ...asset, sortOrder: index })),
      status: "ACTIVE",
      version: 1,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    runtimeDatabase.records.unshift(record);
    persist();
    return success(record);
  },

  async updateRecord(recordId: string, input: SaveRecordInput): Promise<ApiSuccess<GrowthRecord>> {
    const record = runtimeDatabase.records.find((item) => item.id === recordId);
    if (!record) {
      throw new MockApiError("RECORD_NOT_FOUND", "这条成长记录不存在或已删除");
    }
    if (input.version !== record.version) {
      throw new MockApiError("RECORD_VERSION_CONFLICT", "记录已被其他成员修改，请刷新后重试", {
        currentVersion: record.version,
      });
    }

    record.type = input.type;
    record.content = input.content.trim();
    record.occurredAt = input.occurredAt;
    record.assets = input.assets.map((asset, index) => ({ ...asset, sortOrder: index }));
    record.version += 1;
    record.updatedAt = new Date().toISOString();
    persist();
    return success(record);
  },

  async deleteRecord(recordId: string, version: number): Promise<ApiSuccess<null>> {
    const recordIndex = runtimeDatabase.records.findIndex((item) => item.id === recordId);
    if (recordIndex < 0) {
      throw new MockApiError("RECORD_NOT_FOUND", "这条成长记录不存在或已删除");
    }
    if (runtimeDatabase.records[recordIndex].version !== version) {
      throw new MockApiError("RECORD_VERSION_CONFLICT", "记录已被其他成员修改，请刷新后重试");
    }

    runtimeDatabase.records.splice(recordIndex, 1);
    persist();
    return success(null);
  },

  async createLocalMedia(localPath: string, index: number): Promise<ApiSuccess<MediaAsset>> {
    return success({
      id: createMockId("asset"),
      category: "IMAGE",
      url: null,
      localPath,
      width: 1200,
      height: 1200,
      status: "READY",
      sortOrder: index,
    });
  },

  async updateBaby(input: UpdateBabyInput): Promise<ApiSuccess<Baby>> {
    const baby = requireBaby();
    if (input.version !== baby.version) {
      throw new MockApiError("BABY_VERSION_CONFLICT", "宝宝档案已被其他成员修改，请刷新后重试");
    }

    Object.assign(baby, {
      nickname: input.nickname.trim(),
      birthDate: input.birthDate,
      birthTime: input.birthTime,
      timezone: input.timezone,
      gender: input.gender,
      introduction: input.introduction?.trim() || null,
      version: baby.version + 1,
      updatedAt: new Date().toISOString(),
    });
    persist();
    return success(baby);
  },

  async updateFamily(name: string): Promise<ApiSuccess<Family>> {
    const family = runtimeDatabase.families[0];
    if (!family) {
      throw new MockApiError("FAMILY_NOT_FOUND", "家庭信息不存在");
    }
    family.name = name.trim();
    family.updatedAt = new Date().toISOString();
    persist();
    return success(family);
  },

  async onboarding(input: OnboardingInput): Promise<ApiSuccess<BootstrapData>> {
    const timestamp = new Date().toISOString();
    const familyId = createMockId("fam");
    const babyId = createMockId("baby");
    runtimeDatabase.families = [
      {
        id: familyId,
        name: input.familyName.trim(),
        ownerUserId: runtimeDatabase.user.id,
        role: "ADMIN",
        status: "ACTIVE",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ];
    runtimeDatabase.baby = {
      id: babyId,
      familyId,
      nickname: input.babyNickname.trim(),
      avatarUrl: null,
      birthDate: input.birthDate,
      birthTime: input.birthTime,
      timezone: "Asia/Shanghai",
      gender: input.gender,
      introduction: null,
      status: "ACTIVE",
      version: 1,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    runtimeDatabase.records = [];
    persist();
    return this.bootstrap();
  },

  async resetDemo(): Promise<ApiSuccess<BootstrapData>> {
    runtimeDatabase = resetMockDatabase();
    return this.bootstrap();
  },
};
