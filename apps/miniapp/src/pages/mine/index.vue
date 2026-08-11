<script setup lang="ts">
import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { useMessage } from "wot-design-uni/components/wd-message-box/index";
import { authApi } from "@/api/auth-api";
import { mediaApi } from "@/api/media-api";
import { useAppStore } from "@/stores/app";
import { calculateAgeText } from "@/utils/date";

const store = useAppStore();
const message = useMessage();
const displayName = computed(() => {
  const nickname = store.user?.nickname;
  return !nickname || nickname === "小舅舅" ? "家人" : nickname;
});
const babyName = computed(() => store.baby?.nickname || "宝宝");
const nicknameVisible = ref(false);
const nicknameInput = ref("");
const nicknameSaving = ref(false);
const avatarUploading = ref(false);

onShow(() => {
  void store.bootstrap();
});

function navigate(url: string): void {
  uni.navigateTo({ url });
}

function goHome(): void {
  uni.switchTab({ url: "/pages/home/index" });
}

function openNicknameEditor(): void {
  nicknameInput.value = displayName.value;
  nicknameVisible.value = true;
}

async function saveNickname(): Promise<void> {
  const nickname = nicknameInput.value.trim();
  if (!nickname) {
    uni.showToast({ title: "请输入家庭昵称", icon: "none" });
    return;
  }
  nicknameSaving.value = true;
  try {
    const user = await authApi.updateNickname(nickname);
    store.setCurrentUserNickname(user.nickname || nickname);
    nicknameVisible.value = false;
    uni.showToast({ title: "昵称已更新", icon: "success" });
  } catch (error) {
    uni.showToast({ title: error instanceof Error ? error.message : "保存失败", icon: "none" });
  } finally {
    nicknameSaving.value = false;
  }
}

async function changeAvatar(): Promise<void> {
  if (!store.baby) {
    uni.showToast({ title: "加入家庭后才可以设置头像", icon: "none" });
    return;
  }
  try {
    const { tempFilePaths } = await uni.chooseImage({ count: 1, sizeType: ["compressed"], sourceType: ["album", "camera"] });
    const filePath = tempFilePaths[0];
    if (!filePath) return;
    avatarUploading.value = true;
    const { avatarUrl } = await mediaApi.uploadAvatar(store.baby.id, "USER", filePath);
    store.setCurrentUserAvatar(avatarUrl);
    uni.showToast({ title: "头像已更新", icon: "success" });
  } catch (error) {
    if (error instanceof Error && error.message.includes("cancel")) return;
    uni.showToast({ title: error instanceof Error ? error.message : "头像上传失败", icon: "none" });
  } finally {
    avatarUploading.value = false;
  }
}

function switchDevelopmentIdentity(): void {
  const identities = [
    { subject: "local-owner", nickname: "家人", label: "家人（家庭创建者）" },
    { subject: "local-relative", nickname: "家人", label: "家人（邀请加入者）" },
  ];
  uni.showActionSheet({
    itemList: identities.map((identity) => identity.label),
    success: async ({ tapIndex }) => {
      const identity = identities[tapIndex];
      if (!identity) return;
      uni.showLoading({ title: "正在切换身份" });
      try {
        await authApi.switchDevelopmentIdentity({
          subject: identity.subject,
          nickname: identity.nickname,
        });
        await store.bootstrap(true);
        uni.switchTab({ url: "/pages/home/index" });
      } catch (error) {
        uni.showToast({ title: error instanceof Error ? error.message : "切换失败", icon: "none" });
      } finally {
        uni.hideLoading();
      }
    },
  });
}

async function resetDemo(): Promise<void> {
  try {
    await message.confirm({
      title: "恢复演示数据？",
      msg: "你在 Mock 版本中新增和修改的内容会被初始演示数据替换。",
      confirmButtonText: "恢复",
    });
    await store.resetDemo();
    uni.showToast({ title: "已恢复", icon: "success" });
  } catch {
    // 用户取消确认时无需处理。
  }
}
</script>

<template>
  <view :class="['page-shell', 'mine-page', store.themeClass]">
    <view class="mine-page__user-card">
      <image class="mine-page__tape" src="/static/journal/icon_35.webp" mode="aspectFit" />
      <view class="mine-page__avatar" @click="changeAvatar">
        <image v-if="store.user?.avatarUrl" class="mine-page__avatar-image" :src="store.user.avatarUrl" mode="aspectFill" />
        <image v-else class="mine-page__avatar-placeholder" src="/static/journal/icon_47.webp" mode="aspectFit" />
        <text class="mine-page__avatar-action">{{ avatarUploading ? "上传中" : "换头像" }}</text>
      </view>
      <view class="mine-page__identity">
        <text class="mine-page__name">{{ displayName }}</text>
        <text class="mine-page__role">
          {{ !store.family ? "尚未加入家庭" : store.family.role === "ADMIN" ? "家庭管理员" : "家庭成员" }}
        </text>
      </view>
      <view class="mine-page__badge">体验版</view>
    </view>
    <view class="mine-page__group">
      <text class="section-title">个人</text>
      <wd-cell-group border custom-class="mine-cell-group">
        <wd-cell title="家庭昵称" :value="displayName" label="家人看到你的称呼" clickable is-link @click="openNicknameEditor">
          <template #icon><image class="mine-page__cell-icon" src="/static/journal/icon_52.webp" mode="aspectFit" /></template>
        </wd-cell>
      </wd-cell-group>
    </view>

    <view class="mine-page__group">
      <text class="section-title">家庭</text>
      <wd-cell-group border custom-class="mine-cell-group">
        <wd-cell
          v-if="store.family"
          title="宝宝档案"
          :value="store.baby?.nickname || '未设置'"
          label="出生信息、昵称与简介"
          is-link
          size="large"
          @click="navigate('/pages/baby/profile/index')"
        >
          <template #icon><image class="mine-page__cell-icon" src="/static/journal/icon_01.webp" mode="aspectFit" /></template>
        </wd-cell>
        <wd-cell
          v-if="store.family"
          title="家庭信息"
          :value="store.family?.name || '未设置'"
          label="家庭名称与我的角色"
          is-link
          size="large"
          @click="navigate('/pages/family/profile/index')"
        >
          <template #icon><image class="mine-page__cell-icon" src="/static/journal/icon_02.webp" mode="aspectFit" /></template>
        </wd-cell>
        <wd-cell
          v-if="!store.family"
          title="创建或加入家庭"
          label="和家人一起记录宝宝成长"
          is-link
          size="large"
          @click="goHome"
        >
          <template #icon><image class="mine-page__cell-icon" src="/static/journal/icon_02.webp" mode="aspectFit" /></template>
        </wd-cell>
      </wd-cell-group>
    </view>

    <view class="mine-page__group">
      <text class="section-title">偏好与开发</text>
      <wd-cell-group border custom-class="mine-cell-group">
        <wd-cell title="深色模式" label="跟着此项目独立保存">
          <template #icon><image class="mine-page__cell-icon" src="/static/journal/icon_21.webp" mode="aspectFit" /></template>
          <template #value>
            <wd-switch :model-value="store.darkMode" @update:model-value="store.setDarkMode" />
          </template>
        </wd-cell>
        <wd-cell title="Mock 数据" value="恢复初始内容" clickable is-link @click="resetDemo">
          <template #icon><image class="mine-page__cell-icon" src="/static/journal/icon_24.webp" mode="aspectFit" /></template>
        </wd-cell>
        <wd-cell
          v-if="authApi.isDevelopmentLoginEnabled"
          title="切换演示身份"
          :value="authApi.getDevelopmentIdentity().nickname"
          label="单设备测试创建者与加入者"
          clickable
          is-link
          @click="switchDevelopmentIdentity"
        >
          <template #icon><image class="mine-page__cell-icon" src="/static/journal/icon_23.webp" mode="aspectFit" /></template>
        </wd-cell>
        <wd-cell title="当前版本" value="0.2.0 · Hybrid API">
          <template #icon><image class="mine-page__cell-icon" src="/static/journal/icon_20.webp" mode="aspectFit" /></template>
        </wd-cell>
      </wd-cell-group>
    </view>

    <text class="mine-page__footer">只属于家人的小小成长簿</text>
    <wd-popup v-model="nicknameVisible" position="bottom" custom-style="border-radius: 32rpx 32rpx 0 0;">
      <view class="nickname-editor">
        <text class="nickname-editor__title">在 {{ babyName }} 的成长簿中，你是？</text>
        <text class="nickname-editor__subtitle">例如：{{ babyName }}的妈妈、外婆或舅舅</text>
        <wd-input v-model="nicknameInput" :label="`${babyName}的`" placeholder="例如：舅舅" :maxlength="64" clearable />
        <view class="nickname-editor__actions">
          <wd-button block size="large" :loading="nicknameSaving" @click="saveNickname">保存昵称</wd-button>
        </view>
      </view>
    </wd-popup>
    <wd-message-box />
  </view>
</template>

<style lang="scss">

.mine-page {
  &__user-card {
    position: relative;
    display: flex;
    margin: 14rpx 8rpx 0;
    padding: 46rpx 34rpx 34rpx;
    align-items: center;
    border: 1rpx solid rgba(165, 139, 117, 0.2);
    border-radius: 18rpx;
    background: rgba(255, 252, 246, 0.92);
    box-shadow: 0 10rpx 24rpx rgba(112, 84, 64, 0.1);
  }

  &__tape {
    position: absolute;
    top: -34rpx;
    left: 28rpx;
    width: 128rpx;
    height: 70rpx;
    transform: rotate(-12deg);
  }

  &__avatar {
    position: relative;
    display: flex;
    overflow: hidden;
    width: 104rpx;
    height: 104rpx;
    align-items: center;
    justify-content: center;
    border: 6rpx solid var(--color-surface);
    border-radius: 50%;
    background: var(--color-primary-soft);
    font-size: 48rpx;
  }

  &__avatar-image {
    width: 100%;
    height: 100%;
  }

  &__avatar-placeholder {
    width: 100%;
    height: 100%;
  }

  &__avatar-action {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    padding: 4rpx 0;
    color: var(--color-surface);
    background: var(--color-overlay);
    font-size: 18rpx;
    line-height: 1.2;
    text-align: center;
  }

  &__identity {
    display: flex;
    min-width: 0;
    margin-left: 22rpx;
    flex: 1;
    flex-direction: column;
  }

  &__name {
    font-family: "STKaiti", "KaiTi", serif;
    font-size: 38rpx;
    font-weight: 800;
  }

  &__role {
    margin-top: 5rpx;
    color: var(--color-text-secondary);
    font-size: 23rpx;
  }

  &__badge {
    padding: 8rpx 14rpx;
    border-radius: 999rpx;
    color: var(--color-primary-strong);
    background: var(--color-primary-soft);
    font-size: 20rpx;
  }

  &__baby-identity {
    display: flex;
    align-items: center;
  }

  &__baby-icon {
    width: 46rpx;
    height: 46rpx;
    margin-right: 10rpx;
  }

  &__group {
    margin-top: 34rpx;
  }

  &__cell-icon {
    width: 54rpx;
    height: 54rpx;
    margin-right: 18rpx;
  }

  &__footer {
    display: block;
    padding: 52rpx 0 28rpx;
    color: var(--color-text-placeholder);
    font-size: 21rpx;
    text-align: center;
  }
}

.nickname-editor {
  padding: 38rpx 28rpx calc(38rpx + env(safe-area-inset-bottom));
  color: var(--color-text);
  background: var(--color-surface);

  &__title {
    display: block;
    font-size: 34rpx;
    font-weight: 800;
  }

  &__subtitle {
    display: block;
    margin: 10rpx 0 24rpx;
    color: var(--color-text-secondary);
    font-size: 23rpx;
  }

  &__actions {
    margin-top: 28rpx;
  }
}

.mine-cell-group {
  overflow: hidden !important;
  border: 1rpx solid rgba(165, 139, 117, 0.18) !important;
  border-radius: 18rpx !important;
  background: rgba(255, 252, 246, 0.9) !important;
  box-shadow: 0 8rpx 22rpx rgba(112, 84, 64, 0.09) !important;
}

.mine-page .section-title {
  font-family: "STKaiti", "KaiTi", serif;
  font-size: 28rpx;
  letter-spacing: 3rpx;
}
</style>
