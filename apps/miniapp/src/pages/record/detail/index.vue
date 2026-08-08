<script setup lang="ts">
import { ref } from "vue";
import { onLoad, onShow } from "@dcloudio/uni-app";
import { useMessage } from "wot-design-uni/components/wd-message-box/index";
import { recordsApi } from "@/api/records-api";
import { getRecordTypeEmoji, getRecordTypeLabel } from "@/constants/records";
import { useAppStore } from "@/stores/app";
import type { GrowthRecord } from "@/types/domain";
import { calculateAgeText, formatFullDatetime } from "@/utils/date";

const store = useAppStore();
const message = useMessage();
const record = ref<GrowthRecord | null>(null);
const loading = ref(true);
const showActions = ref(false);
const recordId = ref("");

async function loadRecord(): Promise<void> {
  if (!recordId.value) {
    loading.value = false;
    return;
  }
  loading.value = true;
  try {
    await store.bootstrap();
    record.value = await recordsApi.get(recordId.value);
  } catch (error) {
    uni.showToast({ title: error instanceof Error ? error.message : "加载失败", icon: "none" });
  } finally {
    loading.value = false;
  }
}

onLoad((query) => {
  recordId.value = String(query?.id || "");
});

onShow(() => {
  void loadRecord();
});

function editRecord(): void {
  if (!record.value) return;
  uni.navigateTo({ url: `/pages/record/edit/index?id=${record.value.id}` });
}

async function deleteRecord(): Promise<void> {
  if (!record.value) return;
  try {
    await message.confirm({
      title: "删除这条记录？",
      msg: "这会从家庭成长簿中移除这条记录。",
      confirmButtonText: "删除",
    });
    await store.deleteRecord(record.value.id, record.value.version);
    uni.showToast({ title: "已删除", icon: "success" });
    setTimeout(() => uni.navigateBack(), 500);
  } catch {
    // 用户取消确认时无需处理。
  }
}

function handleAction(event: { index: number }): void {
  if (event.index === 0) editRecord();
  else void deleteRecord();
}

function goBack(): void {
  uni.navigateBack();
}
</script>

<template>
  <view :class="['page-shell', 'record-detail', store.themeClass]">
    <view v-if="loading" class="surface-card">
      <wd-skeleton theme="paragraph" animation="gradient" :row-col="[1, 1, 1, 1]" />
    </view>

    <view v-else-if="record" class="record-detail__content">
      <view class="record-detail__heading">
        <view class="record-detail__type-icon">{{ getRecordTypeEmoji(record.type) }}</view>
        <view class="record-detail__heading-main">
          <text class="record-detail__type">{{ getRecordTypeLabel(record.type) }}</text>
          <text class="record-detail__age">
            {{ calculateAgeText(store.baby?.birthDate || '', record.occurredAt) }}
          </text>
        </view>
        <view class="record-detail__more" @click="showActions = true">···</view>
      </view>

      <view class="surface-card record-detail__story">
        <text class="record-detail__text">{{ record.content }}</text>
      </view>

      <view class="record-detail__meta surface-card">
        <view class="record-detail__meta-row">
          <text>发生时间</text>
          <text>{{ formatFullDatetime(record.occurredAt) }}</text>
        </view>
        <view class="record-detail__meta-row">
          <text>记录人</text>
          <text>{{ record.creator.nickname }}</text>
        </view>
        <view class="record-detail__meta-row">
          <text>当前版本</text>
          <text>v{{ record.version }}</text>
        </view>
      </view>
    </view>

    <view v-else class="record-detail__empty surface-card">
      <wd-status-tip image="content" tip="这条记录不存在或已删除" />
      <wd-button size="small" @click="goBack">返回</wd-button>
    </view>

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
.record-detail {
  &__content {
    display: grid;
    gap: 24rpx;
  }

  &__heading {
    display: flex;
    padding: 14rpx 8rpx;
    align-items: center;
  }

  &__type-icon {
    display: flex;
    width: 86rpx;
    height: 86rpx;
    align-items: center;
    justify-content: center;
    border-radius: 28rpx;
    background: var(--color-primary-soft);
    font-size: 42rpx;
  }

  &__heading-main {
    display: flex;
    margin-left: 20rpx;
    flex: 1;
    flex-direction: column;
  }

  &__type {
    font-size: 34rpx;
    font-weight: 800;
  }

  &__age {
    margin-top: 4rpx;
    color: var(--color-text-secondary);
    font-size: 23rpx;
  }

  &__more {
    padding: 20rpx;
    color: var(--color-text-secondary);
    font-size: 36rpx;
  }

  &__story {
    padding: 34rpx;
  }

  &__text {
    color: var(--color-text);
    font-size: 31rpx;
    line-height: 1.85;
  }

  &__meta {
    padding: 8rpx 28rpx;
  }

  &__meta-row {
    display: flex;
    padding: 24rpx 0;
    justify-content: space-between;
    color: var(--color-text-secondary);
    font-size: 24rpx;
    border-bottom: 1rpx solid var(--color-divider);

    &:last-child {
      border-bottom: 0;
    }
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20rpx;
  }
}
</style>
