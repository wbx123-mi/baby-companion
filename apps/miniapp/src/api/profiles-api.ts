import type { BabyContract, FamilySummaryContract } from "@baby-companion/contracts";
import { authenticatedRequest } from "./auth-api";
import type { UpdateBabyInput } from "@/types/domain";

export const profilesApi = {
  updateFamily(familyId: string, name: string): Promise<FamilySummaryContract> {
    return authenticatedRequest({ path: `/families/${familyId}`, method: "PUT", data: { name: name.trim() } });
  },
  updateBaby(babyId: string, input: UpdateBabyInput): Promise<BabyContract> {
    return authenticatedRequest({ path: `/babies/${babyId}`, method: "PUT", data: input });
  },
};
