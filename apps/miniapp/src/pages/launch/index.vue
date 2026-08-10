<script setup lang="ts">
import { onMounted } from "vue";
import { useAppStore } from "@/stores/app";

const store = useAppStore();

onMounted(async () => {
  try {
    const [data] = await Promise.all([
      store.bootstrap(),
      new Promise((resolve) => setTimeout(resolve, 900)),
    ]);

    if (data.nextAction === "ENTER_APP" || data.nextAction === "NO_FAMILY") {
      uni.switchTab({ url: "/pages/home/index" });
      return;
    }
    uni.redirectTo({ url: "/pages/common/unavailable/index" });
  } catch {
    uni.redirectTo({ url: "/pages/common/unavailable/index" });
  }
});
</script>

<template>
  <view :class="['launch-page', store.themeClass]">
    <view class="launch-page__halo">
      <view class="launch-page__mark">👶🏻</view>
    </view>
    <text class="launch-page__title">宝宝的成长簿</text>
    <text class="launch-page__subtitle">把爱藏进每一个平常日子</text>
    <view class="launch-page__loading">
      <wd-loading size="22px" color="var(--color-primary)" />
      <text>正在翻开成长故事…</text>
    </view>
  </view>
</template>

<style scoped lang="scss">
.launch-page {
  display: flex;
  min-height: 100vh;
  padding: 80rpx 48rpx;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--gradient-hero);

  &__halo {
    display: flex;
    width: 220rpx;
    height: 220rpx;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: var(--color-surface);
    box-shadow: var(--shadow-card);
  }

  &__mark {
    display: flex;
    width: 160rpx;
    height: 160rpx;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: var(--color-primary-soft);
    font-size: 82rpx;
  }

  &__title {
    margin-top: 46rpx;
    color: var(--color-text);
    font-size: 48rpx;
    font-weight: 800;
    letter-spacing: 3rpx;
  }

  &__subtitle {
    margin-top: 14rpx;
    color: var(--color-text-secondary);
    font-size: 25rpx;
    letter-spacing: 2rpx;
  }

  &__loading {
    display: flex;
    margin-top: 88rpx;
    align-items: center;
    gap: 14rpx;
    color: var(--color-text-secondary);
    font-size: 23rpx;
  }
}
</style>
