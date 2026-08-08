<script setup lang="ts">
import { ref } from "vue";
import { authApi } from "@/api/auth-api";

const loading = ref(false);

async function retry(): Promise<void> {
  loading.value = true;
  try {
    const data = await authApi.getBootstrap();
    if (data.nextAction === "ENTER_APP") {
      uni.switchTab({ url: "/pages/growth/index" });
    } else if (data.nextAction === "NO_FAMILY") {
      uni.redirectTo({ url: "/pages/onboarding/index" });
    }
  } catch {
    uni.showToast({ title: "仍然无法进入，请稍后再试", icon: "none" });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <view class="page-shell unavailable-page">
    <view class="surface-card unavailable-page__card">
      <wd-status-tip image="network" tip="暂时无法打开家庭空间" />
      <text class="unavailable-page__description">可能是家庭上下文不完整，或 Mock 数据暂时不可用。</text>
      <wd-button :loading="loading" @click="retry">重新检查</wd-button>
    </view>
  </view>
</template>

<style scoped lang="scss">
.unavailable-page {
  display: flex;
  align-items: center;
  justify-content: center;

  &__card {
    display: flex;
    width: 100%;
    padding: 48rpx 30rpx;
    flex-direction: column;
    align-items: center;
    gap: 24rpx;
  }

  &__description {
    max-width: 520rpx;
    color: var(--color-text-secondary);
    font-size: 24rpx;
    line-height: 1.6;
    text-align: center;
  }
}
</style>
