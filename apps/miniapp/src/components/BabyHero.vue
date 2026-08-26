<script setup lang="ts">
import type { Baby } from "@/types/domain";
import { calculateAgeText } from "@/utils/date";
import { journalAsset } from "@/utils/journal-assets";

defineProps<{
  baby: Baby;
  recordCount: number;
}>();

defineEmits<{
  (event: "open-profile"): void;
}>();
</script>

<template>
  <view class="baby-hero" @click="$emit('open-profile')">
    <image class="baby-hero__background" :src="journalAsset('growth-profile-card-components/profile-card-background.webp')" mode="scaleToFill" />
    <image class="baby-hero__tape" :src="journalAsset('growth-profile-card-components/pink-dotted-tape.webp')" mode="aspectFit" />
    <image class="baby-hero__leaf" :src="journalAsset('growth-profile-card-components/leaf-sprig.webp')" mode="aspectFit" />
    <view class="baby-hero__profile">
      <view class="baby-hero__avatar">
        <image class="baby-hero__avatar-frame" :src="journalAsset('growth-profile-card-components/avatar-frame.webp')" mode="aspectFit" />
        <image v-if="baby.avatarUrl" class="baby-hero__avatar-image" :src="baby.avatarUrl" mode="aspectFill" />
        <text v-else>👶🏻</text>
      </view>
      <view class="baby-hero__identity">
        <text class="baby-hero__name">{{ baby.nickname }}</text>
        <text class="baby-hero__summary">出生{{ calculateAgeText(baby.birthDate) }} · {{ recordCount }} 条成长故事</text>
        <text class="baby-hero__arrow">查看档案 ›</text>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.baby-hero {
  position: relative;
  min-height: 258rpx;
  margin: 8rpx -2rpx 0;
  padding: 62rpx 54rpx 46rpx;
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

  &__tape {
    position: absolute;
    z-index: 1;
    top: 4rpx;
    right: 42rpx;
    width: 122rpx;
    height: 72rpx;
    transform: rotate(10deg);
  }

  &__leaf {
    position: absolute;
    z-index: 1;
    right: 54rpx;
    bottom: 44rpx;
    width: 92rpx;
    height: 92rpx;
  }

  &__profile {
    display: flex;
    align-items: center;
  }

  &__profile {
    position: relative;
    z-index: 1;
  }

  &__avatar {
    display: flex;
    position: relative;
    width: 122rpx;
    height: 122rpx;
    overflow: hidden;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    border: 0;
    border-radius: 50%;
    background: var(--color-primary-soft);
    font-size: 44rpx;
  }

  &__avatar-frame {
    position: absolute;
    z-index: 2;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  &__avatar-image {
    position: relative;
    z-index: 1;
    width: 102rpx;
    height: 102rpx;
    border-radius: 50%;
  }

  &__identity {
    min-width: 0;
    display: flex;
    margin-left: 28rpx;
    flex-direction: column;
  }

  &__name {
    color: var(--color-text);
    font-size: 36rpx;
    font-weight: 800;
  }

  &__summary {
    display: block;
    margin-top: 10rpx;
    color: var(--color-text-secondary);
    font-size: 24rpx;
  }

  &__arrow {
    margin-top: 12rpx;
    color: var(--color-primary-strong);
    font-size: 21rpx;
  }
}
</style>
