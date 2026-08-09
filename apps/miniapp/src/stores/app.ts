import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { mockApi } from "@/services/mock-api";
import { authApi } from "@/api/auth-api";
import { recordsApi } from "@/api/records-api";
import { profilesApi } from "@/api/profiles-api";
import type {
  Baby,
  BootstrapData,
  Family,
  GrowthRecord,
  RecordFilters,
  SaveRecordInput,
  UpdateBabyInput,
} from "@/types/domain";

const THEME_KEY = "baby-companion:dark-mode";

export const useAppStore = defineStore("app", () => {
  const bootstrapData = ref<BootstrapData | null>(null);
  const records = ref<GrowthRecord[]>([]);
  const filters = ref<RecordFilters>({});
  const bootstrapped = ref(false);
  const loading = ref(false);
  const recordsLoading = ref(false);
  const darkMode = ref(Boolean(uni.getStorageSync(THEME_KEY)));

  const user = computed(() => bootstrapData.value?.user ?? null);
  const family = computed<Family | null>(() => bootstrapData.value?.families[0] ?? null);
  const baby = computed<Baby | null>(() => bootstrapData.value?.baby ?? null);
  const themeClass = computed(() => (darkMode.value ? "wot-theme-dark" : ""));

  async function bootstrap(force = false): Promise<BootstrapData> {
    if (bootstrapped.value && bootstrapData.value && !force) {
      return bootstrapData.value;
    }
    loading.value = true;
    try {
      const data = await authApi.getBootstrap();
      bootstrapData.value = data;
      bootstrapped.value = true;
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function loadRecords(): Promise<void> {
    const currentBaby = baby.value;
    if (!currentBaby) {
      records.value = [];
      return;
    }
    recordsLoading.value = true;
    try {
      records.value = await recordsApi.list(currentBaby.id, filters.value);
    } finally {
      recordsLoading.value = false;
    }
  }

  async function saveRecord(recordId: string | undefined, input: SaveRecordInput): Promise<GrowthRecord> {
    const currentBaby = baby.value;
    if (!currentBaby) throw new Error("请先创建或加入家庭");
    const record = recordId
      ? await recordsApi.update(recordId, input)
      : await recordsApi.create(currentBaby.id, input);
    await loadRecords();
    return record;
  }

  async function deleteRecord(recordId: string, version: number): Promise<void> {
    await recordsApi.delete(recordId, version);
    await loadRecords();
  }

  async function saveBaby(input: UpdateBabyInput): Promise<Baby> {
    const currentBaby = baby.value;
    if (!currentBaby) throw new Error("宝宝档案不存在");
    const saved = await profilesApi.updateBaby(currentBaby.id, input);
    if (bootstrapData.value) bootstrapData.value.baby = saved;
    return saved;
  }

  async function saveFamily(name: string): Promise<Family> {
    const currentFamily = family.value;
    if (!currentFamily) throw new Error("家庭不存在");
    const saved = await profilesApi.updateFamily(currentFamily.id, name);
    if (bootstrapData.value) bootstrapData.value.families[0] = saved;
    return saved;
  }

  function setFilters(nextFilters: RecordFilters): void {
    filters.value = nextFilters;
  }

  function setBootstrapData(data: BootstrapData): void {
    bootstrapData.value = data;
    bootstrapped.value = true;
  }

  function setCurrentUserNickname(nickname: string): void {
    if (bootstrapData.value) bootstrapData.value.user.nickname = nickname;
  }

  function setCurrentUserAvatar(avatarUrl: string): void {
    if (bootstrapData.value) bootstrapData.value.user.avatarUrl = avatarUrl;
  }

  function setCurrentBabyAvatar(avatarUrl: string): void {
    if (bootstrapData.value?.baby) bootstrapData.value.baby.avatarUrl = avatarUrl;
  }

  function setDarkMode(enabled: boolean): void {
    darkMode.value = enabled;
    uni.setStorageSync(THEME_KEY, enabled);
  }

  async function resetDemo(): Promise<void> {
    await mockApi.resetDemo();
    filters.value = {};
    await loadRecords();
  }

  return {
    bootstrapData,
    records,
    filters,
    bootstrapped,
    loading,
    recordsLoading,
    darkMode,
    user,
    family,
    baby,
    themeClass,
    bootstrap,
    loadRecords,
    saveRecord,
    deleteRecord,
    saveBaby,
    saveFamily,
    setBootstrapData,
    setCurrentUserNickname,
    setCurrentUserAvatar,
    setCurrentBabyAvatar,
    setFilters,
    setDarkMode,
    resetDemo,
  };
});
