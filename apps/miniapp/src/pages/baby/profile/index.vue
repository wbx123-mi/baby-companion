<script setup lang="ts">
import { reactive, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { useAppStore } from "@/stores/app";
import type { Gender } from "@/types/domain";
import { toDateValue } from "@/utils/date";

const store = useAppStore();
const saving = ref(false);
const form = reactive({
  nickname: "",
  birthDate: Date.now(),
  birthTime: "" as string,
  gender: "UNSPECIFIED" as Gender,
  introduction: "",
  version: 1,
});

onLoad(async () => {
  await store.bootstrap();
  const baby = store.baby;
  if (!baby) return;
  form.nickname = baby.nickname;
  form.birthDate = new Date(`${baby.birthDate}T00:00:00+08:00`).getTime();
  form.birthTime = baby.birthTime?.slice(0, 5) || "";
  form.gender = baby.gender;
  form.introduction = baby.introduction || "";
  form.version = baby.version;
});

async function submit(): Promise<void> {
  if (!form.nickname.trim()) {
    uni.showToast({ title: "请填写宝宝昵称", icon: "none" });
    return;
  }
  saving.value = true;
  try {
    const baby = await store.saveBaby({
      nickname: form.nickname,
      birthDate: toDateValue(form.birthDate),
      birthTime: form.birthTime ? `${form.birthTime}:00` : null,
      timezone: "Asia/Shanghai",
      gender: form.gender,
      introduction: form.introduction || null,
      version: form.version,
    });
    form.version = baby.version;
    uni.showToast({ title: "档案已保存", icon: "success" });
    setTimeout(() => uni.navigateBack(), 500);
  } catch (error) {
    uni.showToast({ title: error instanceof Error ? error.message : "保存失败", icon: "none" });
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <view :class="['page-shell', 'baby-profile', store.themeClass]">
    <view class="baby-profile__avatar-card">
      <view class="baby-profile__avatar">👶🏻</view>
      <text class="baby-profile__name">{{ form.nickname || "宝宝" }}</text>
      <text class="baby-profile__hint">这些信息会用来计算成长天数</text>
    </view>

    <view class="surface-card baby-profile__form">
      <wd-input v-model="form.nickname" label="宝宝昵称" placeholder="例如：小满" required clearable />
      <wd-datetime-picker
        v-model="form.birthDate"
        type="date"
        label="出生日期"
        title="选择出生日期"
        :min-date="new Date(2020, 0, 1).getTime()"
        :max-date="Date.now()"
        required
      />
      <wd-datetime-picker
        v-model="form.birthTime"
        type="time"
        label="出生时间"
        title="选择出生时间"
        placeholder="可以不填"
        clearable
      />
      <view class="baby-profile__gender">
        <text class="baby-profile__label">性别</text>
        <wd-radio-group v-model="form.gender" shape="button" inline>
          <wd-radio value="MALE">男孩</wd-radio>
          <wd-radio value="FEMALE">女孩</wd-radio>
          <wd-radio value="UNSPECIFIED">暂不设置</wd-radio>
        </wd-radio-group>
      </view>
      <wd-textarea
        v-model="form.introduction"
        label="宝宝寄语"
        placeholder="写一句欢迎宝宝的话"
        :maxlength="200"
        show-word-limit
        auto-height
      />
    </view>

    <view class="baby-profile__actions">
      <wd-button block size="large" :loading="saving" @click="submit">保存宝宝档案</wd-button>
    </view>
  </view>
</template>

<style scoped lang="scss">
.baby-profile {
  &__avatar-card {
    display: flex;
    padding: 36rpx 28rpx;
    flex-direction: column;
    align-items: center;
    border-radius: 30rpx;
    background: var(--gradient-hero);
  }

  &__avatar {
    display: flex;
    width: 116rpx;
    height: 116rpx;
    align-items: center;
    justify-content: center;
    border: 6rpx solid var(--color-surface);
    border-radius: 50%;
    background: var(--color-primary-soft);
    font-size: 58rpx;
  }

  &__name {
    margin-top: 16rpx;
    font-size: 34rpx;
    font-weight: 800;
  }

  &__hint {
    margin-top: 4rpx;
    color: var(--color-text-secondary);
    font-size: 22rpx;
  }

  &__form {
    margin-top: 24rpx;
    padding: 16rpx 28rpx;
  }

  &__gender {
    padding: 26rpx 0;
    border-top: 1rpx solid var(--color-divider);
    border-bottom: 1rpx solid var(--color-divider);
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
