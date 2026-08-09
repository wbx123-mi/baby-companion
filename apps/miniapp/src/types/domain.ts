import type {
  Gender,
  MemberRole,
  NextAction,
  RecordType,
} from "@baby-companion/contracts";

export type {
  Gender,
  MemberRole,
  NextAction,
  RecordType,
} from "@baby-companion/contracts";

export type MockMediaTheme = "sun" | "heart" | "sky";

export interface User {
  id: string;
  nickname: string | null;
  avatarUrl: string | null;
}

export interface Family {
  id: string;
  name: string;
  ownerUserId?: string;
  role: MemberRole;
  status: "ACTIVE";
  createdAt?: string;
  updatedAt?: string;
}

export interface Baby {
  id: string;
  familyId: string;
  nickname: string;
  avatarUrl: string | null;
  birthDate: string;
  birthTime: string | null;
  timezone: string;
  gender: Gender;
  introduction: string | null;
  status?: "ACTIVE";
  version: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface RecordCreator {
  id: string;
  nickname: string;
  avatarUrl: string | null;
}

export interface MediaAsset {
  id: string;
  category: "IMAGE";
  url: string | null;
  localPath: string | null;
  width: number;
  height: number;
  status: "READY";
  sortOrder: number;
  mockTheme?: MockMediaTheme;
  mockEmoji?: string;
}

export interface GrowthRecord {
  id: string;
  familyId: string;
  babyId: string;
  type: RecordType;
  content: string;
  occurredAt: string;
  creator: RecordCreator;
  assets: MediaAsset[];
  status: "ACTIVE";
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface BootstrapData {
  user: User;
  families: Family[];
  baby: Baby | null;
  currentContext: {
    familyId: string;
    babyId: string;
  } | null;
  nextAction: NextAction;
}

export interface RecordFilters {
  type?: RecordType;
  month?: string;
}

export interface SaveRecordInput {
  type: RecordType;
  content: string;
  occurredAt: string;
  assets: MediaAsset[];
  version?: number;
}

export interface UpdateBabyInput {
  nickname: string;
  birthDate: string;
  birthTime: string | null;
  timezone: string;
  gender: Gender;
  introduction: string | null;
  version: number;
}

export interface OnboardingInput {
  familyName: string;
  babyNickname: string;
  birthDate: string;
  birthTime: string | null;
  gender: Gender;
}

export interface MockDatabase {
  schemaVersion: number;
  user: User;
  families: Family[];
  baby: Baby | null;
  records: GrowthRecord[];
}

export interface ApiSuccess<T> {
  data: T;
  requestId: string;
}

export class MockApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "MockApiError";
  }
}
