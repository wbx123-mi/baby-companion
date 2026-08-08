export type MemberRole = "ADMIN" | "PARENT" | "RELATIVE";

export type Gender = "MALE" | "FEMALE" | "UNSPECIFIED";

export type RecordType = "DAILY" | "FIRST" | "FAMILY" | "OTHER";

export type NextAction = "NO_FAMILY" | "ENTER_APP" | "UNAVAILABLE";

export interface UserContract {
  id: string;
  nickname: string | null;
  avatarUrl: string | null;
}

export interface FamilySummaryContract {
  id: string;
  name: string;
  role: MemberRole;
  status: "ACTIVE";
}

export interface BabyContract {
  id: string;
  familyId: string;
  nickname: string;
  birthDate: string;
  birthTime: string | null;
  timezone: string;
  gender: Gender;
  introduction: string | null;
  version: number;
}

export interface MediaAssetContract {
  id: string;
  category: "IMAGE";
  width: number;
  height: number;
  status: "READY";
  sortOrder: number;
  accessUrl?: string;
}

export interface GrowthRecordContract {
  id: string;
  familyId: string;
  babyId: string;
  type: RecordType;
  content: string;
  occurredAt: string;
  creator: UserContract;
  assets: MediaAssetContract[];
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface BootstrapContract {
  user: UserContract;
  families: FamilySummaryContract[];
  baby: BabyContract | null;
  currentContext: {
    familyId: string;
    babyId: string;
  } | null;
  nextAction: NextAction;
}

export interface AuthTokensContract {
  accessToken: string;
  accessTokenExpiresIn: number;
  refreshToken: string;
  refreshTokenExpiresIn: number;
  user: UserContract;
}

export interface OnboardingContract {
  family: {
    name: string;
  };
  baby: {
    nickname: string;
    birthDate: string;
    birthTime: string | null;
    timezone: string;
    gender: Gender;
  };
}

export interface FamilyInviteContract {
  code: string;
  expiresAt: string;
  family: {
    id: string;
    name: string;
  };
}

export interface FamilyMemberContract {
  userId: string;
  nickname: string | null;
  avatarUrl: string | null;
  role: MemberRole;
  joinedAt: string;
}

export interface ApiSuccess<T> {
  data: T;
  requestId: string;
  meta?: {
    nextCursor: string | null;
    hasMore: boolean;
  };
}

export interface ApiFailure {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  requestId: string;
}
