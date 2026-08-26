<script setup lang="ts">
import { computed } from "vue";
import { getRecordTypeLabel } from "@/constants/records";
import type { GrowthRecord, RecordType } from "@/types/domain";
import { calculateAgeText, formatRecordTime } from "@/utils/date";
import { journalAsset } from "@/utils/journal-assets";

const props = defineProps<{
  record: GrowthRecord;
  birthDate: string;
}>();

const emit = defineEmits<{
  (event: "open", recordId: string): void;
  (event: "more", record: GrowthRecord): void;
}>();

function getCoverUrl(record: GrowthRecord): string | null {
  const asset = record.assets[0];
  return asset?.localPath || asset?.url || null;
}

const coverUrl = computed(() => getCoverUrl(props.record));

const recordTypeIcons: Record<RecordType, string> = {
  DAILY: journalAsset("growth-timeline-webp-assets/09_category_daily_sun.webp"),
  FIRST: journalAsset("growth-timeline-webp-assets/15_category_first.webp"),
  FAMILY: journalAsset("growth-timeline-webp-assets/18_category_family_time.webp"),
  OTHER: journalAsset("growth-timeline-webp-assets/06_category_first_star.webp"),
};

</script>

<template>
  <view class="record-card__tap" @click="emit('open', record.id)">
    <wd-card custom-class="growth-record-card">
      <template #title>
        <view class="record-card__header">
          <view class="record-card__identity">
            <view class="record-card__type-slot">
              <image class="record-card__type-icon" :src="recordTypeIcons[record.type]" mode="aspectFit" />
            </view>
            <view class="record-card__heading">
              <text class="record-card__type">{{ getRecordTypeLabel(record.type) }}</text>
              <text class="record-card__meta">
                {{ formatRecordTime(record.occurredAt) }} · {{ calculateAgeText(birthDate, record.occurredAt) }}
              </text>
            </view>
          </view>
          <view class="record-card__header-right">
            <view class="record-card__time">
              <image class="record-card__time-icon" :src="journalAsset('growth-timeline-webp-assets/10_clock.webp')" mode="aspectFit" />
              <text>{{ formatRecordTime(record.occurredAt) }}</text>
            </view>
            <view class="record-card__more" @click.stop="emit('more', record)">···</view>
          </view>
        </view>
      </template>

      <view class="record-card__body">
        <text class="record-card__content">{{ record.content }}</text>
        <view class="record-card__cover">
          <wd-img v-if="coverUrl" class="record-card__cover-image" :src="coverUrl" width="100%" height="100%" mode="aspectFill" :enable-preview="false" />
          <view v-else class="record-card__cover-empty" />
        </view>
      </view>

      <template #footer>
        <view class="record-card__footer">
          <view class="record-card__author">
            <view class="record-card__author-avatar-slot" />
            <text>{{ record.creator.nickname }}记录</text>
          </view>
          <view class="record-card__footer-right">
            <view v-if="record.flowerCount" class="record-card__flowers">
              <image class="record-card__flower-icon" :src="journalAsset('growth-timeline-webp-assets/13_reaction_flower.webp')" mode="aspectFit" />
              <text>{{ record.flowerCount }}</text>
            </view>
            <text>查看详情 ›</text>
          </view>
        </view>
      </template>
    </wd-card>
  </view>
</template>

<style lang="scss">
.growth-record-card {
  display: block !important;
  margin: 0 !important;
  min-height: 420rpx;
  overflow: hidden !important;
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
  &__header-right,
  &__time,
  &__body,
  &__footer,
  &__footer-right,
  &__author {
    display: flex;
    align-items: center;
  }

  &__header,
  &__footer {
    justify-content: space-between;
  }

  &__type-slot {
    display: flex;
    width: 68rpx;
    height: 68rpx;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    border-radius: 22rpx;
    background: var(--color-primary-soft);
    border: 1rpx solid var(--color-border);
  }

  &__type-icon {
    width: 46rpx;
    height: 46rpx;
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
    min-width: 48rpx;
    padding: 12rpx 0 12rpx 12rpx;
    color: var(--color-text-secondary);
    font-size: 34rpx;
    line-height: 1;
    text-align: right;
  }

  &__header-right {
    flex-shrink: 0;
    gap: 6rpx;
  }

  &__time {
    color: var(--color-text-secondary);
    font-size: 22rpx;
  }

  &__time-icon {
    width: 32rpx;
    height: 32rpx;
    margin-right: 4rpx;
  }

  &__content {
    display: -webkit-box;
    flex: 1;
    overflow: hidden;
    color: var(--color-text);
    font-size: 28rpx;
    line-height: 1.65;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 6;
  }

  &__body {
    position: relative;
    min-height: 224rpx;
    gap: 20rpx;
  }

  &__cover {
    position: relative;
    width: 224rpx;
    height: 224rpx;
    flex-shrink: 0;
    overflow: hidden;
    border: 1rpx solid var(--color-border);
    border-radius: 16rpx;
    background: var(--color-surface-muted);
  }

  &__cover-image,
  &__cover-empty {
    display: block;
    width: 100%;
    height: 100%;
  }

  &__cover-empty {
    background: var(--color-primary-soft);
  }

  &__cover-tape {
    position: absolute;
    z-index: 1;
    top: -10rpx;
    right: -10rpx;
    width: 86rpx;
    height: 50rpx;
    transform: rotate(18deg);
    pointer-events: none;
  }

  &__footer {
    width: 100%;
    color: var(--color-text-secondary);
    font-size: 22rpx;
  }

  &__footer-right {
    gap: 12rpx;
  }

  &__author {
    min-width: 0;
    gap: 10rpx;
  }

  &__author-avatar-slot {
    width: 38rpx;
    height: 38rpx;
    flex-shrink: 0;
    border-radius: 50%;
  }

  &__author-avatar-slot {
    background: var(--color-surface-muted);
    border: 1rpx solid var(--color-border);
  }

  &__flowers {
    display: flex;
    align-items: center;
    gap: 4rpx;
    color: var(--color-primary-strong);
    font-size: 22rpx;
    font-weight: 700;
  }

  &__flower-icon {
    width: 32rpx;
    height: 38rpx;
  }

}
</style>
