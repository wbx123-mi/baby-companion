import type { MockDatabase } from "@/types/domain";

const STORAGE_KEY = "baby-companion:mock-db:v1";

const now = "2026-08-07T02:00:00.000Z";

const seedDatabase: MockDatabase = {
  schemaVersion: 1,
  user: {
    id: "usr_mock_uncle",
    nickname: "小舅舅",
    avatarUrl: null,
  },
  families: [
    {
      id: "fam_mock_home",
      name: "小满的家",
      ownerUserId: "usr_mock_uncle",
      role: "ADMIN",
      status: "ACTIVE",
      createdAt: "2026-07-30T01:00:00.000Z",
      updatedAt: now,
    },
  ],
  baby: {
    id: "baby_mock_xiaoman",
    familyId: "fam_mock_home",
    nickname: "小满",
    avatarUrl: null,
    birthDate: "2026-07-30",
    birthTime: "08:26:00",
    timezone: "Asia/Shanghai",
    gender: "UNSPECIFIED",
    introduction: "欢迎来到这个温柔的世界。",
    status: "ACTIVE",
    version: 1,
    createdAt: "2026-07-30T01:00:00.000Z",
    updatedAt: now,
  },
  records: [
    {
      id: "rec_mock_sun",
      familyId: "fam_mock_home",
      babyId: "baby_mock_xiaoman",
      type: "FIRST",
      content: "出生第七天，第一次在窗边晒太阳。小手握得紧紧的，阳光落在脸上特别温柔。",
      occurredAt: "2026-08-06T01:15:00.000Z",
      creator: { id: "usr_mock_uncle", nickname: "小舅舅", avatarUrl: null },
      assets: [
        {
          id: "asset_mock_sun",
          category: "IMAGE",
          url: null,
          localPath: null,
          width: 1440,
          height: 1080,
          status: "READY",
          sortOrder: 0,
          mockTheme: "sun",
          mockEmoji: "☀️",
        },
      ],
      status: "ACTIVE",
      version: 1,
      createdAt: "2026-08-06T01:20:00.000Z",
      updatedAt: "2026-08-06T01:20:00.000Z",
    },
    {
      id: "rec_mock_family",
      familyId: "fam_mock_home",
      babyId: "baby_mock_xiaoman",
      type: "FAMILY",
      content: "一家人第一次拍合照。以后每年都在同一个位置留一张吧。",
      occurredAt: "2026-08-03T11:30:00.000Z",
      creator: { id: "usr_mock_uncle", nickname: "小舅舅", avatarUrl: null },
      assets: [
        {
          id: "asset_mock_heart",
          category: "IMAGE",
          url: null,
          localPath: null,
          width: 1440,
          height: 1080,
          status: "READY",
          sortOrder: 0,
          mockTheme: "heart",
          mockEmoji: "🫶",
        },
      ],
      status: "ACTIVE",
      version: 1,
      createdAt: "2026-08-03T11:32:00.000Z",
      updatedAt: "2026-08-03T11:32:00.000Z",
    },
    {
      id: "rec_mock_home",
      familyId: "fam_mock_home",
      babyId: "baby_mock_xiaoman",
      type: "DAILY",
      content: "今天回到家啦。第一次认真看这个世界，也第一次住进自己的小房间。",
      occurredAt: "2026-08-01T06:10:00.000Z",
      creator: { id: "usr_mock_uncle", nickname: "小舅舅", avatarUrl: null },
      assets: [
        {
          id: "asset_mock_sky",
          category: "IMAGE",
          url: null,
          localPath: null,
          width: 1440,
          height: 1080,
          status: "READY",
          sortOrder: 0,
          mockTheme: "sky",
          mockEmoji: "☁️",
        },
      ],
      status: "ACTIVE",
      version: 1,
      createdAt: "2026-08-01T06:12:00.000Z",
      updatedAt: "2026-08-01T06:12:00.000Z",
    },
    {
      id: "rec_mock_birth",
      familyId: "fam_mock_home",
      babyId: "baby_mock_xiaoman",
      type: "FIRST",
      content: "小满出生啦，平安健康，第一次和大家见面。",
      occurredAt: "2026-07-30T00:26:00.000Z",
      creator: { id: "usr_mock_uncle", nickname: "小舅舅", avatarUrl: null },
      assets: [],
      status: "ACTIVE",
      version: 1,
      createdAt: "2026-07-30T01:10:00.000Z",
      updatedAt: "2026-07-30T01:10:00.000Z",
    },
  ],
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function readMockDatabase(): MockDatabase {
  try {
    const saved = uni.getStorageSync(STORAGE_KEY) as MockDatabase | "";
    if (saved && saved.schemaVersion === seedDatabase.schemaVersion) {
      return clone(saved);
    }
  } catch {
    // 隐私模式或存储不可用时退回内存种子数据。
  }

  return clone(seedDatabase);
}

export function writeMockDatabase(database: MockDatabase): void {
  try {
    uni.setStorageSync(STORAGE_KEY, clone(database));
  } catch {
    // Mock 预览允许在存储不可用时仅维持当前运行时状态。
  }
}

export function resetMockDatabase(): MockDatabase {
  const database = clone(seedDatabase);
  writeMockDatabase(database);
  return database;
}
