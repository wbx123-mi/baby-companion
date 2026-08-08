<script setup lang="ts">
import { reactive, ref } from "vue";
import { authApi } from "@/api/auth-api";
import { useAppStore } from "@/stores/app";
import type { Gender } from "@/types/domain";

const store = useAppStore();
const saving = ref(false);
const idempotencyKey = `onboarding_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
const form = reactive({
  familyName: "宝宝的小家",
  babyNickname: "",
  birthDate: Date.now(),
  birthTime: "",
  gender: "UNSPECIFIED" as Gender,
});

function toDateValue(timestamp: number): string {
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

async function submit(): Promise<void> {
  if (!form.familyName.trim() || !form.babyNickname.trim()) {
    uni.showToast({ title: "请补全家庭名称和宝宝昵称", icon: "none" });
    return;
  }
  saving.value = true;
  try {
    const data = await authApi.onboarding({
      family: { name: form.familyName },
      baby: {
        nickname: form.babyNickname,
        birthDate: toDateValue(form.birthDate),
        birthTime: form.birthTime ? `${form.birthTime}:00` : null,
        timezone: "Asia/Shanghai",
        gender: form.gender,
      },
    }, idempotencyKey);
    store.setBootstrapData(data);
    uni.switchTab({ url: "/pages/home/index" });
  } catch (error) {
    uni.showToast({ title: error instanceof Error ? error.message : "创建失败", icon: "none" });
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <view class="page-shell onboarding-page">
    <view class="onboarding-page__hero">
      <text class="onboarding-page__emoji">🌱</text>
      <text class="onboarding-page__title">为宝宝建一个成长小家</text>
      <text class="onboarding-page__subtitle">给家人和宝宝准备一个只属于你们的温暖空间。</text>
    </view>

    <view class="surface-card onboarding-page__form">
      <wd-input v-model="form.familyName" label="家庭名称" required clearable />
      <wd-input v-model="form.babyNickname" label="宝宝昵称" placeholder="例如：小满" required clearable />
      <wd-datetime-picker
        v-model="form.birthDate"
        type="date"
        label="出生日期"
        :min-date="new Date(2020, 0, 1).getTime()"
        :max-date="Date.now()"
        required
      />
      <wd-datetime-picker v-model="form.birthTime" type="time" label="出生时间" placeholder="可以不填" clearable />
      <view class="onboarding-page__gender">
        <text class="onboarding-page__label">性别</text>
        <wd-radio-group v-model="form.gender" shape="button" inline>
          <wd-radio value="MALE">男孩</wd-radio>
          <wd-radio value="FEMALE">女孩</wd-radio>
          <wd-radio value="UNSPECIFIED">暂不设置</wd-radio>
        </wd-radio-group>
      </view>
    </view>

    <view class="onboarding-page__actions">
      <wd-button block size="large" :loading="saving" @click="submit">创建并开始记录</wd-button>
    </view>
  </view>
</template>

<style scoped lang="scss">
.onboarding-page {
  &__hero {
    display: flex;
    padding: 38rpx 10rpx;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  &__emoji {
    font-size: 72rpx;
  }

  &__title {
    margin-top: 18rpx;
    font-size: 39rpx;
    font-weight: 800;
  }

  &__subtitle {
    margin-top: 10rpx;
    color: var(--color-text-secondary);
    font-size: 24rpx;
  }

  &__form {
    padding: 12rpx 26rpx;
  }

  &__gender {
    padding: 26rpx 0;
    border-top: 1rpx solid var(--color-divider);
  }

  &__label {
    display: block;
    margin-bottom: 16rpx;
    font-size: 26rpx;
    font-weight: 700;
  }

  &__actions {
    margin-top: 28rpx;
  }
}
</style>
