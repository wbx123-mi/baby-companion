<script setup lang="ts">
import { getRecordTypeLabel } from "@/constants/records";
import type { GrowthRecord, RecordType } from "@/types/domain";
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

const recordTypeIcons: Record<RecordType, string> = {
  DAILY: "",
  FIRST: "/static/journal/icon_54.webp",
  FAMILY: "/static/journal/icon_53.webp",
  OTHER: "/static/journal/icon_26.webp",
};
</script>

<template>
  <view class="record-card__tap" @click="emit('open', record.id)">
    <wd-card custom-class="growth-record-card">
      <template #title>
        <view class="record-card__header">
          <view class="record-card__identity">
            <view class="record-card__avatar">
              <text v-if="record.type === 'DAILY'" class="record-card__avatar-symbol">☀️</text>
              <image v-else class="record-card__avatar-image" :src="recordTypeIcons[record.type]" mode="aspectFit" />
            </view>
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
      <view class="record-card__media">
        <MediaGallery :assets="record.assets" compact :previewable="false" />
        <image v-if="record.assets.length" class="record-card__tape" src="/static/journal/15_tape_pink_check.webp" mode="aspectFit" />
      </view>

      <template #footer>
        <view class="record-card__footer">
          <text>{{ record.creator.nickname }}记录</text>
          <text>查看详情 ›</text>
        </view>
      </template>
    </wd-card>
  </view>
</template>

<style lang="scss">
.growth-record-card {
  display: block !important;
  margin: 0 !important;
  overflow: visible !important;
  border: 1rpx solid rgba(165, 139, 117, 0.2) !important;
  border-radius: 24rpx !important;
  background: rgba(255, 252, 246, 0.92) !important;
  box-shadow: 0 10rpx 24rpx rgba(112, 84, 64, 0.1) !important;
}

.record-card {
  &__tap {
    display: block;
  }

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
    background: #f7f0df;
  }

  &__avatar-image {
    width: 50rpx;
    height: 50rpx;
  }

  &__avatar-symbol {
    font-size: 42rpx;
    line-height: 1;
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

  &__media {
    position: relative;
    margin-top: 18rpx;
  }

  &__tape {
    position: absolute;
    z-index: 2;
    top: -30rpx;
    right: -12rpx;
    width: 96rpx;
    height: 64rpx;
    transform: rotate(10deg);
    pointer-events: none;
  }

  &__footer {
    width: 100%;
    color: var(--color-text-secondary);
    font-size: 22rpx;
  }
}
</style>
