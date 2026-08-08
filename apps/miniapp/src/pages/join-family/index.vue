<script setup lang="ts">
import { ref } from "vue";
import { authApi } from "@/api/auth-api";
import { useAppStore } from "@/stores/app";

const store = useAppStore();
const code = ref("");
const joining = ref(false);

function goBack(): void {
  uni.navigateBack();
}

async function submit(): Promise<void> {
  const normalizedCode = code.value.trim();
  if (!normalizedCode) {
    uni.showToast({ title: "请输入家庭邀请码", icon: "none" });
    return;
  }

  joining.value = true;
  try {
    const data = await authApi.joinFamily(normalizedCode);
    store.setBootstrapData(data);
    uni.showToast({ title: `已加入${data.families[0]?.name || "家庭"}`, icon: "success" });
    setTimeout(() => uni.switchTab({ url: "/pages/home/index" }), 500);
  } catch (error) {
    uni.showToast({ title: error instanceof Error ? error.message : "加入失败", icon: "none" });
  } finally {
    joining.value = false;
  }
}
</script>

<template>
  <view :class="['page-shell', 'join-page', store.themeClass]">
    <view class="join-page__hero">
      <view class="join-page__mark">💌</view>
      <text class="join-page__title">加入家人的成长空间</text>
      <text class="join-page__subtitle">向家庭管理员获取邀请码，输入后即可一起陪伴宝宝成长。</text>
    </view>

    <view class="surface-card join-page__form">
      <wd-input
        v-model="code"
        label="邀请码"
        placeholder="例如 ABCDE-FGHIJ"
        :maxlength="16"
        clearable
        required
      />
      <view class="join-page__hint">
        <text class="join-page__hint-icon">🕐</text>
        <text>邀请码 7 天内有效，不区分大小写。</text>
      </view>
    </view>

    <view class="join-page__actions">
      <wd-button block size="large" :loading="joining" @click="submit">确认加入家庭</wd-button>
      <wd-button block size="large" plain @click="goBack">暂不加入</wd-button>
    </view>
  </view>
</template>

<style scoped lang="scss">
.join-page {
  &__hero {
    display: flex;
    padding: 42rpx 24rpx 38rpx;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  &__mark {
    display: flex;
    width: 138rpx;
    height: 138rpx;
    align-items: center;
    justify-content: center;
    border-radius: 44rpx;
    background: var(--color-primary-soft);
    font-size: 66rpx;
    transform: rotate(-4deg);
  }

  &__title {
    margin-top: 28rpx;
    font-size: 36rpx;
    font-weight: 800;
  }

  &__subtitle {
    max-width: 560rpx;
    margin-top: 12rpx;
    color: var(--color-text-secondary);
    font-size: 24rpx;
    line-height: 1.7;
  }

  &__form {
    padding: 14rpx 26rpx 24rpx;
  }

  &__hint {
    display: flex;
    margin-top: 12rpx;
    padding: 20rpx;
    align-items: center;
    border-radius: 18rpx;
    color: var(--color-text-secondary);
    background: var(--color-surface-muted);
    font-size: 22rpx;
  }

  &__hint-icon {
    margin-right: 10rpx;
  }

  &__actions {
    display: grid;
    margin-top: 28rpx;
    gap: 18rpx;
  }
}
</style>
