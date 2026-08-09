<script setup lang="ts">
import type { Baby } from "@/types/domain";
import { calculateAgeText, formatBirthText } from "@/utils/date";

defineProps<{
  baby: Baby;
}>();

defineEmits<{
  (event: "open-profile"): void;
}>();
</script>

<template>
  <view class="baby-hero" @click="$emit('open-profile')">
    <view class="baby-hero__glow">🌙</view>
    <view class="baby-hero__top">
      <view class="baby-hero__avatar">
        <image v-if="baby.avatarUrl" class="baby-hero__avatar-image" :src="baby.avatarUrl" mode="aspectFill" />
        <text v-else>👶🏻</text>
      </view>
      <view class="baby-hero__identity">
        <view class="baby-hero__name-row">
          <text class="baby-hero__name">{{ baby.nickname }}</text>
          <text class="baby-hero__arrow">档案 ›</text>
        </view>
        <text class="baby-hero__birth">{{ formatBirthText(baby.birthDate, baby.birthTime) }}出生</text>
      </view>
    </view>
    <view class="baby-hero__age">
      <text class="baby-hero__age-label">今天是</text>
      <text class="baby-hero__age-value">{{ calculateAgeText(baby.birthDate) }}</text>
    </view>
    <text class="baby-hero__intro">{{ baby.introduction || "把每个普通日子，慢慢写成成长故事。" }}</text>
  </view>
</template>

<style scoped lang="scss">
.baby-hero {
  position: relative;
  padding: 34rpx;
  overflow: hidden;
  border: 1rpx solid var(--color-border);
  border-radius: 34rpx;
  background: var(--gradient-hero);
  box-shadow: var(--shadow-card);

  &__glow {
    position: absolute;
    top: 18rpx;
    right: 24rpx;
    opacity: 0.48;
    font-size: 72rpx;
    transform: rotate(12deg);
  }

  &__top,
  &__name-row,
  &__age {
    display: flex;
    align-items: center;
  }

  &__avatar {
    display: flex;
    width: 100rpx;
    height: 100rpx;
    overflow: hidden;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    border: 6rpx solid var(--color-surface);
    border-radius: 50%;
    background: var(--color-primary-soft);
    font-size: 50rpx;
    box-shadow: var(--shadow-card);
  }

  &__avatar-image {
    width: 100%;
    height: 100%;
  }

  &__identity {
    min-width: 0;
    margin-left: 24rpx;
  }

  &__name-row {
    gap: 14rpx;
  }

  &__name {
    color: var(--color-text);
    font-size: 40rpx;
    font-weight: 800;
  }

  &__arrow {
    color: var(--color-primary-strong);
    font-size: 22rpx;
  }

  &__birth {
    display: block;
    margin-top: 6rpx;
    color: var(--color-text-secondary);
    font-size: 22rpx;
  }

  &__age {
    margin-top: 34rpx;
    align-items: baseline;
  }

  &__age-label {
    color: var(--color-text-secondary);
    font-size: 24rpx;
  }

  &__age-value {
    margin-left: 12rpx;
    color: var(--color-primary-strong);
    font-size: 40rpx;
    font-weight: 800;
  }

  &__intro {
    display: block;
    margin-top: 16rpx;
    color: var(--color-text-secondary);
    font-size: 24rpx;
  }
}
</style>
