<script setup lang="ts">
import { computed, ref } from "vue";
import { onPullDownRefresh, onShow } from "@dcloudio/uni-app";
import { useMessage } from "wot-design-uni/components/wd-message-box/index";
import BabyHero from "@/components/BabyHero.vue";
import GrowthRecordCard from "@/components/GrowthRecordCard.vue";
import { RECORD_TYPE_OPTIONS } from "@/constants/records";
import { useAppStore } from "@/stores/app";
import type { GrowthRecord, RecordType } from "@/types/domain";
import { formatMonthKey, formatMonthLabel } from "@/utils/date";
import { journalAsset } from "@/utils/journal-assets";

const store = useAppStore();
const message = useMessage();
const showActions = ref(false);
const selectedRecord = ref<GrowthRecord | null>(null);
const hasFamily = computed(() => Boolean(store.family && store.baby));
const isFamilyAdmin = computed(() => store.family?.role === "ADMIN");

function canManageRecord(record: GrowthRecord): boolean {
  return isFamilyAdmin.value || record.creator.id === store.user?.id;
}

const months = computed(() => {
  return [...new Set(store.records.map((record) => formatMonthKey(record.occurredAt)))];
});

const timeline = computed(() => {
  const groups: Array<{ key: string; date: string; caption: string; records: GrowthRecord[] }> = [];
  for (const record of store.records) {
    const { key, date, caption } = getTimelineDate(record.occurredAt);
    const current = groups[groups.length - 1];
    if (current?.key === key) current.records.push(record);
    else groups.push({ key, date, caption, records: [record] });
  }
  return groups;
});

const typeChipIcons: Partial<Record<RecordType | "ALL", string>> = {
  ALL: journalAsset("growth-timeline-webp-assets/04_category_grid.webp"),
  DAILY: journalAsset("growth-timeline-webp-assets/05_category_home.webp"),
  FIRST: journalAsset("growth-timeline-webp-assets/06_category_first_star.webp"),
  FAMILY: journalAsset("growth-timeline-webp-assets/07_category_family.webp"),
};

const typeChips = computed<Array<{ value?: RecordType; label: string; icon?: string }>>(() => [
  { value: undefined, label: "全部", icon: typeChipIcons.ALL },
  ...RECORD_TYPE_OPTIONS.map((item) => ({ value: item.value, label: item.label, icon: typeChipIcons[item.value] })),
]);

const timelineMonthLabel = computed(() => {
  const month = store.filters.month || months.value[0];
  return month ? `${formatMonthLabel(month)} · 把每个普通日子留住` : "把每个普通日子留住";
});

function getTimelineDate(iso: string): { key: string; date: string; caption: string } {
  const date = new Date(iso);
  const today = new Date();
  const localRecordDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const localToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dayDiff = Math.round((localToday.getTime() - localRecordDate.getTime()) / 86_400_000);
  const caption = dayDiff === 0 ? "今天" : dayDiff === 1 ? "昨天" : `周${["日", "一", "二", "三", "四", "五", "六"][date.getDay()]}`;
  return {
    key: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
    date: `${date.getMonth() + 1}月${date.getDate()}日`,
    caption,
  };
}

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
    <BabyHero v-if="hasFamily && store.baby" :baby="store.baby" :record-count="store.records.length" @open-profile="openBabyProfile" />

    <view v-if="hasFamily" class="growth-page__filters">
      <scroll-view scroll-x class="filter-scroll" :show-scrollbar="false">
        <view class="filter-row">
          <view
            v-for="chip in typeChips"
            :key="chip.label"
            :class="['filter-chip', { 'filter-chip--active': store.filters.type === chip.value }]"
            @click="chooseType(chip.value)"
          >
            <image v-if="chip.icon" class="filter-chip__icon" :src="chip.icon" mode="aspectFit" />
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
      <text class="growth-page__timeline-note">{{ timelineMonthLabel }}</text>
      <view class="growth-page__timeline-line" />
      <view v-for="group in timeline" :key="group.key" class="timeline-group">
        <view class="timeline-group__date">
          <text class="timeline-group__day">{{ group.date }}</text>
          <text class="timeline-group__caption">{{ group.caption }}</text>
        </view>
        <view class="timeline-group__dot" />
        <view class="timeline-group__records">
          <GrowthRecordCard
            v-for="record in group.records"
            :key="record.id"
            :record="record"
            :birth-date="store.baby?.birthDate || ''"
            :can-manage="canManageRecord(record)"
            @open="openRecord"
            @more="openActions"
          />
        </view>
      </view>
      <view class="growth-page__record-action">
        <wd-button block size="large" @click="createRecord">记下这一刻</wd-button>
      </view>
    </view>

    <view v-else-if="hasFamily" class="growth-page__empty">
      <image class="growth-page__empty-paper" :src="journalAsset('card-bg.webp')" mode="scaleToFill" />
      <view class="growth-page__empty-content">
        <image class="growth-page__empty-art" :src="journalAsset('icon_52.webp')" mode="aspectFit" />
        <text class="growth-page__empty-title">还没有成长记录</text>
        <text class="growth-page__empty-description">把今天的小事写下来，慢慢就会变成宝宝的成长故事。</text>
        <view class="growth-page__empty-action">
          <wd-button block size="large" @click="createRecord">记下这一刻</wd-button>
        </view>
      </view>
    </view>

    <view v-else class="growth-page__empty">
      <image class="growth-page__empty-paper" :src="journalAsset('card-bg.webp')" mode="scaleToFill" />
      <view class="growth-page__empty-content">
        <image class="growth-page__empty-art" :src="journalAsset('icon_53.webp')" mode="aspectFit" />
        <text class="growth-page__empty-title">先开启一个温暖的小家</text>
        <text class="growth-page__empty-description">加入家庭后，就能和家人一起记录宝宝的每一次成长。</text>
        <view class="growth-page__empty-action">
          <wd-button block size="large" @click="goHome">返回首页</wd-button>
        </view>
      </view>
    </view>

    <view class="safe-bottom-space" />
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
  --wot-button-primary-bg-color: var(--color-primary);
  --wot-button-primary-color: var(--color-surface-muted);
  --wot-button-large-height: 76rpx;
  --wot-button-large-radius: 38rpx;
  --wot-button-large-fs: 28rpx;

  &__filters {
    margin: 22rpx -4rpx 0;
  }

  &__skeleton {
    display: grid;
    gap: 24rpx;
    margin-top: 28rpx;
  }

  &__timeline {
    position: relative;
    margin-top: 30rpx;
  }

  &__timeline-note {
    display: block;
    margin: 0 0 24rpx 118rpx;
    color: var(--color-text-secondary);
    font-size: 22rpx;
    letter-spacing: 1rpx;
  }

  &__timeline-line {
    position: absolute;
    top: 66rpx;
    bottom: 92rpx;
    left: 104rpx;
    width: 2rpx;
    background: var(--color-border);
  }

  &__record-action {
    margin: 18rpx 0 4rpx 128rpx;
  }

  &__empty {
    position: relative;
    display: flex;
    min-height: 560rpx;
    margin-top: 20rpx;
    padding: 82rpx 72rpx 68rpx;
    overflow: hidden;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  &__empty-paper {
    position: absolute;
    z-index: 0;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  &__empty-content {
    position: relative;
    z-index: 1;
    display: flex;
    width: 100%;
    align-items: center;
    flex-direction: column;
  }

  &__empty-art {
    width: 132rpx;
    height: 132rpx;
  }

  &__empty-title {
    margin-top: 18rpx;
    color: var(--color-text);
    font-family: "STKaiti", "KaiTi", serif;
    font-size: 36rpx;
    font-weight: 800;
    letter-spacing: 1rpx;
  }

  &__empty-description {
    max-width: 450rpx;
    margin-top: 12rpx;
    color: var(--color-text-secondary);
    font-size: 23rpx;
    line-height: 1.7;
    text-align: center;
  }

  &__empty-action {
    width: 320rpx;
    margin-top: 30rpx;
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
  background: var(--color-surface-muted);
  border: 1rpx solid var(--color-border);
  box-shadow: var(--shadow-card);
}

.filter-chip {
  display: flex;
  padding: 14rpx 24rpx;
  align-items: center;
  border-radius: 999rpx;
  font-size: 24rpx;

  &__icon {
    width: 30rpx;
    height: 30rpx;
    margin-right: 8rpx;
  }

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
  position: relative;
  min-height: 88rpx;
  padding: 0 0 26rpx 128rpx;

  & + & {
    margin-top: 12rpx;
  }

  &__date {
    position: absolute;
    top: 2rpx;
    left: 0;
    display: flex;
    width: 82rpx;
    align-items: flex-end;
    flex-direction: column;
  }

  &__day {
    color: var(--color-text);
    font-size: 24rpx;
    font-weight: 700;
  }

  &__caption {
    margin-top: 4rpx;
    color: var(--color-primary-strong);
    font-size: 21rpx;
  }

  &__dot {
    position: absolute;
    z-index: 1;
    top: 8rpx;
    left: 96rpx;
    width: 18rpx;
    height: 18rpx;
    border: 4rpx solid var(--color-bg);
    border-radius: 50%;
    background: var(--color-primary);
    box-shadow: 0 0 0 2rpx var(--color-primary-soft);
  }

  &__records {
    display: grid;
    gap: 18rpx;
  }
}
</style>
