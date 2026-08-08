<script setup lang="ts">
import { getRecordTypeEmoji, getRecordTypeLabel } from "@/constants/records";
import type { GrowthRecord } from "@/types/domain";
import { calculateAgeText, formatRecordTime } from "@/utils/date";
import MediaGallery from "./MediaGallery.vue";

defineProps<{
  record: GrowthRecord;
  birthDate: string;
}>();

const emit = defineEmits<{
  (event: "open", recordId: string): void;
  (event: "more", record: GrowthRecord): void;
}>();
</script>

<template>
  <wd-card custom-class="growth-record-card" @click="emit('open', record.id)">
    <template #title>
      <view class="record-card__header">
        <view class="record-card__identity">
          <view class="record-card__avatar">{{ getRecordTypeEmoji(record.type) }}</view>
          <view class="record-card__heading">
            <text class="record-card__type">{{ getRecordTypeLabel(record.type) }}</text>
            <text class="record-card__meta">
              {{ formatRecordTime(record.occurredAt) }} · {{ calculateAgeText(birthDate, record.occurredAt) }}
            </text>
          </view>
        </view>
        <view class="record-card__more" @click.stop="emit('more', record)">···</view>
      </view>
    </template>

    <text class="record-card__content">{{ record.content }}</text>
    <MediaGallery :assets="record.assets" compact />

    <template #footer>
      <view class="record-card__footer">
        <text>{{ record.creator.nickname }}记录</text>
        <text>查看详情 ›</text>
      </view>
    </template>
  </wd-card>
</template>

<style lang="scss">
.growth-record-card {
  display: block !important;
  margin: 0 !important;
  border-radius: 28rpx !important;
  background: var(--color-surface) !important;
  box-shadow: var(--shadow-card) !important;
}

.record-card {
  &__header,
  &__identity,
  &__footer {
    display: flex;
    align-items: center;
  }

  &__header,
  &__footer {
    justify-content: space-between;
  }

  &__avatar {
    display: flex;
    width: 68rpx;
    height: 68rpx;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    border-radius: 22rpx;
    background: var(--color-primary-soft);
    font-size: 32rpx;
  }

  &__heading {
    display: flex;
    margin-left: 18rpx;
    flex-direction: column;
  }

  &__type {
    color: var(--color-text);
    font-size: 28rpx;
    font-weight: 700;
  }

  &__meta {
    margin-top: 2rpx;
    color: var(--color-text-secondary);
    font-size: 22rpx;
  }

  &__more {
    min-width: 64rpx;
    padding: 12rpx 0 12rpx 24rpx;
    color: var(--color-text-secondary);
    font-size: 34rpx;
    line-height: 1;
    text-align: right;
  }

  &__content {
    display: -webkit-box;
    overflow: hidden;
    color: var(--color-text);
    font-size: 28rpx;
    line-height: 1.65;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
  }

  &__footer {
    width: 100%;
    color: var(--color-text-secondary);
    font-size: 22rpx;
  }
}
</style>
