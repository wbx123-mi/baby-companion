<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useAppStore } from "@/stores/app";
import { journalAsset } from "@/utils/journal-assets";

const store = useAppStore();

// 背景图走 journalAsset，支持远程地址配置；深色模式不设背景
const launchBgStyle = computed(() =>
  store.themeClass
    ? { backgroundImage: "none" }
    : { backgroundImage: `url(${journalAsset("paper-background-clean.webp")})` }
);

onMounted(async () => {
  try {
    const [data] = await Promise.all([
      store.bootstrap(),
      new Promise((resolve) => setTimeout(resolve, 900)),
    ]);

    if (data.nextAction === "ENTER_APP" || data.nextAction === "NO_FAMILY") {
      // 预加载首页，让首页在 switchTab 前就开始实例化，减少首次切 tab 的白屏
      try {
        uni.preloadPage({ url: "/pages/home/index" });
      } catch {
        // 基础库不支持预加载时静默降级，不影响跳转
      }
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
  <view :class="['launch-page', store.themeClass]" :style="launchBgStyle">
    <view class="launch-page__content">
      <image
        class="launch-page__growth-card"
        :src="journalAsset('growth-card-transparent.webp')"
        mode="widthFix"
      />
      <view class="launch-page__progress" aria-label="正在加载">
        <view class="launch-page__progress-dot" />
        <view class="launch-page__progress-dot" />
        <view class="launch-page__progress-dot" />
        <view class="launch-page__progress-dot" />
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.launch-page {
  display: flex;
  min-height: 100vh;
  padding: 0 34rpx;
  align-items: center;
  justify-content: flex-start;
  background-color: var(--color-bg);
  background-repeat: no-repeat;
  background-position: top center;
  background-size: cover;

  &__content {
    display: flex;
    width: 100%;
    align-items: center;
    flex-direction: column;
  }

  &__growth-card {
    width: 550rpx; /* 3/5 屏幕宽 = 750 * 3/5 */
    filter: drop-shadow(0 14rpx 18rpx rgba(108, 82, 53, 0.1));
    animation: launch-card-in 420ms ease-out both;
  }

  &__progress {
    display: flex;
    margin-top: 190rpx;
    align-items: center;
    gap: 22rpx;
    animation: launch-progress-in 360ms 160ms ease-out both;
  }

  &__progress-dot {
    width: 20rpx;
    height: 20rpx;
    border-radius: 50%;
    background: var(--color-primary);
    animation: launch-dot-pulse 1.2s ease-in-out infinite both;

    &:nth-child(1) {
      animation-delay: 0s;
    }

    &:nth-child(2) {
      animation-delay: 0.15s;
    }

    &:nth-child(3) {
      animation-delay: 0.3s;
    }

    &:nth-child(4) {
      animation-delay: 0.45s;
    }
  }
}

@keyframes launch-card-in {
  from {
    opacity: 0;
    transform: translateY(18rpx);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes launch-progress-in {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes launch-dot-pulse {
  0%,
  100% {
    opacity: 0.2;
    transform: scale(0.7);
  }

  50% {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
