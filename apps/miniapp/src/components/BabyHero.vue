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
    <image class="baby-hero__background" src="/static/journal/card-bg.webp" mode="scaleToFill" />
    <image class="baby-hero__moon" src="/static/journal/03_moon_stars.webp" mode="aspectFit" />
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
  min-height: 400rpx;
  margin: 0 -14rpx;
  padding: 72rpx 64rpx 46rpx 72rpx;
  overflow: hidden;
  background-color: transparent;

  &__background {
    position: absolute;
    z-index: 0;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  &__moon {
    position: absolute;
    z-index: 1;
    top: 88rpx;
    right: 50rpx;
    width: 104rpx;
    height: 110rpx;
  }

  &__top,
  &__name-row,
  &__age {
    display: flex;
    align-items: center;
  }

  &__top,
  &__age,
  &__intro {
    position: relative;
    z-index: 1;
  }

  &__avatar {
    display: flex;
    width: 96rpx;
    height: 96rpx;
    overflow: hidden;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    border: 5rpx solid var(--color-surface);
    border-radius: 50%;
    background: var(--color-primary-soft);
    font-size: 44rpx;
    box-shadow: 0 6rpx 18rpx rgba(130, 83, 58, 0.1);
  }

  &__avatar-image {
    width: 100%;
    height: 100%;
  }

  &__identity {
    min-width: 0;
    margin-left: 20rpx;
  }

  &__name-row {
    gap: 12rpx;
  }

  &__name {
    color: var(--color-text);
    font-size: 36rpx;
    font-weight: 800;
  }

  &__arrow {
    padding: 6rpx 14rpx;
    border-radius: 18rpx;
    color: var(--color-primary-strong);
    background: var(--color-primary-soft);
    font-size: 20rpx;
  }

  &__birth {
    display: block;
    margin-top: 6rpx;
    color: var(--color-text-secondary);
    font-size: 22rpx;
  }

  &__age {
    margin-top: 24rpx;
    padding-top: 20rpx;
    align-items: baseline;
    justify-content: center;
    border-top: 1rpx solid rgba(127, 116, 110, 0.18);
  }

  &__age-label {
    color: var(--color-text-secondary);
    font-size: 22rpx;
  }

  &__age-value {
    margin-left: 10rpx;
    color: var(--color-primary-strong);
    font-size: 38rpx;
    font-weight: 800;
  }

  &__intro {
    display: block;
    margin-top: 12rpx;
    color: var(--color-text-secondary);
    font-size: 22rpx;
    text-align: center;
  }
}
</style>
