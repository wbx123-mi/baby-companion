<script setup lang="ts">
import { computed, ref } from "vue";
import { onPullDownRefresh, onShow } from "@dcloudio/uni-app";
import { useMessage } from "wot-design-uni/components/wd-message-box/index";
import BabyHero from "@/components/BabyHero.vue";
import GrowthRecordCard from "@/components/GrowthRecordCard.vue";
import { RECORD_TYPE_OPTIONS } from "@/constants/records";
import { useAppStore } from "@/stores/app";
import type { GrowthRecord, RecordType } from "@/types/domain";
import { formatMonthKey, formatMonthLabel, formatRecordDate } from "@/utils/date";

const store = useAppStore();
const message = useMessage();
const showActions = ref(false);
const selectedRecord = ref<GrowthRecord | null>(null);
const hasFamily = computed(() => Boolean(store.family && store.baby));

const months = computed(() => {
  return [...new Set(store.records.map((record) => formatMonthKey(record.occurredAt)))];
});

const timeline = computed(() => {
  const groups: Array<{ date: string; records: GrowthRecord[] }> = [];
  for (const record of store.records) {
    const date = formatRecordDate(record.occurredAt);
    const current = groups[groups.length - 1];
    if (current?.date === date) current.records.push(record);
    else groups.push({ date, records: [record] });
  }
  return groups;
});

const typeChips = computed(() => [
  { value: undefined, label: "全部" },
  ...RECORD_TYPE_OPTIONS.map((item) => ({ value: item.value, label: item.label })),
]);

async function initialize(): Promise<void> {
  await store.bootstrap();
  if (hasFamily.value) await store.loadRecords();
}

onShow(() => {
  void initialize();
});

onPullDownRefresh(async () => {
  try {
    await initialize();
  } finally {
    uni.stopPullDownRefresh();
  }
});

async function chooseType(type?: RecordType): Promise<void> {
  store.setFilters({ ...store.filters, type });
  await store.loadRecords();
}

async function chooseMonth(month?: string): Promise<void> {
  store.setFilters({ ...store.filters, month });
  await store.loadRecords();
}

function openRecord(recordId: string): void {
  uni.navigateTo({ url: `/pages/record/detail/index?id=${recordId}` });
}

function openActions(record: GrowthRecord): void {
  selectedRecord.value = record;
  showActions.value = true;
}

function createRecord(): void {
  uni.navigateTo({ url: "/pages/record/edit/index" });
}

function openBabyProfile(): void {
  uni.navigateTo({ url: "/pages/baby/profile/index" });
}

function goHome(): void {
  uni.switchTab({ url: "/pages/home/index" });
}

async function handleAction(event: { index: number }): Promise<void> {
  const record = selectedRecord.value;
  if (!record) return;
  if (event.index === 0) {
    uni.navigateTo({ url: `/pages/record/edit/index?id=${record.id}` });
    return;
  }

  try {
    await message.confirm({
      title: "删除这条记录？",
      msg: "删除后当前 Mock 版本无法从回收站恢复。",
      confirmButtonText: "删除",
    });
    await store.deleteRecord(record.id, record.version);
    uni.showToast({ title: "已删除", icon: "success" });
  } catch {
    // 用户取消确认时无需提示。
  }
}
</script>

<template>
  <view :class="['page-shell', 'growth-page', store.themeClass]">
    <view class="growth-page__top-space" />
    <BabyHero v-if="hasFamily && store.baby" :baby="store.baby" @open-profile="openBabyProfile" />

    <view v-if="hasFamily" class="growth-page__filters">
      <scroll-view scroll-x class="filter-scroll" :show-scrollbar="false">
        <view class="filter-row">
          <view
            v-for="chip in typeChips"
            :key="chip.label"
            :class="['filter-chip', { 'filter-chip--active': store.filters.type === chip.value }]"
            @click="chooseType(chip.value)"
          >
            {{ chip.label }}
          </view>
        </view>
      </scroll-view>
      <scroll-view v-if="months.length > 1" scroll-x class="filter-scroll" :show-scrollbar="false">
        <view class="filter-row filter-row--month">
          <view
            :class="['month-chip', { 'month-chip--active': !store.filters.month }]"
            @click="chooseMonth()"
          >
            全部月份
          </view>
          <view
            v-for="month in months"
            :key="month"
            :class="['month-chip', { 'month-chip--active': store.filters.month === month }]"
            @click="chooseMonth(month)"
          >
            {{ formatMonthLabel(month) }}
          </view>
        </view>
      </scroll-view>
    </view>

    <view v-if="hasFamily && store.recordsLoading" class="growth-page__skeleton">
      <wd-skeleton theme="paragraph" animation="gradient" :row-col="[1, 1, 1]" />
      <wd-skeleton theme="paragraph" animation="gradient" :row-col="[1, 1, 1]" />
    </view>

    <view v-else-if="hasFamily && timeline.length" class="growth-page__timeline">
      <view v-for="group in timeline" :key="group.date" class="timeline-group">
        <view class="timeline-group__date-row">
          <view class="timeline-group__dot" />
          <text class="timeline-group__date">{{ group.date }}</text>
        </view>
        <view class="timeline-group__records">
          <GrowthRecordCard
            v-for="record in group.records"
            :key="record.id"
            :record="record"
            :birth-date="store.baby?.birthDate || ''"
            @open="openRecord"
            @more="openActions"
          />
        </view>
      </view>
    </view>

    <view v-else-if="hasFamily" class="growth-page__empty surface-card">
      <wd-status-tip image="content" tip="还没有符合条件的成长记录" />
      <wd-button size="small" @click="createRecord">记下这一刻</wd-button>
    </view>

    <view v-else class="growth-page__empty surface-card">
      <wd-status-tip image="content" tip="加入家庭后，就能和家人一起记录成长" />
      <wd-button size="small" @click="goHome">返回首页</wd-button>
    </view>

    <view class="safe-bottom-space" />
    <wd-fab v-if="hasFamily" :expandable="false" :gap="{ bottom: 92, right: 18 }" @click="createRecord" />
    <wd-action-sheet
      v-model="showActions"
      title="记录操作"
      cancel-text="取消"
      :actions="[{ name: '编辑记录' }, { name: '删除记录', color: 'var(--color-danger)' }]"
      @select="handleAction"
    />
    <wd-message-box />
  </view>
</template>

<style scoped lang="scss">
.growth-page {
  padding-top: 0;
  background: var(--color-bg);

  &__top-space {
    height: 24rpx;
    background: var(--color-bg);
  }

  &__filters {
    margin-top: 26rpx;
  }

  &__skeleton {
    display: grid;
    gap: 24rpx;
    margin-top: 28rpx;
  }

  &__timeline {
    margin-top: 28rpx;
  }

  &__empty {
    display: flex;
    margin-top: 30rpx;
    flex-direction: column;
    align-items: center;
    gap: 20rpx;
  }
}

.filter-scroll {
  width: 100%;
  white-space: nowrap;
}

.filter-row {
  display: inline-flex;
  gap: 14rpx;
  padding-right: 24rpx;

  &--month {
    margin-top: 14rpx;
  }
}

.filter-chip,
.month-chip {
  flex-shrink: 0;
  color: var(--color-text-secondary);
  background: var(--color-surface);
  border: 1rpx solid var(--color-border);
}

.filter-chip {
  padding: 14rpx 24rpx;
  border-radius: 999rpx;
  font-size: 24rpx;

  &--active {
    color: var(--color-surface);
    background: var(--color-primary);
    border-color: var(--color-primary);
    font-weight: 700;
  }
}

.month-chip {
  padding: 9rpx 18rpx;
  border-radius: 14rpx;
  font-size: 21rpx;

  &--active {
    color: var(--color-primary-strong);
    background: var(--color-primary-soft);
    border-color: var(--color-primary-soft);
  }
}

.timeline-group {
  & + & {
    margin-top: 34rpx;
  }

  &__date-row {
    display: flex;
    margin-bottom: 16rpx;
    align-items: center;
  }

  &__dot {
    width: 14rpx;
    height: 14rpx;
    margin: 0 14rpx 0 4rpx;
    border-radius: 50%;
    background: var(--color-primary);
    box-shadow: 0 0 0 8rpx var(--color-primary-soft);
  }

  &__date {
    color: var(--color-text-secondary);
    font-size: 24rpx;
    font-weight: 600;
  }

  &__records {
    display: grid;
    gap: 22rpx;
  }
}
</style>
