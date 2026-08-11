<script setup lang="ts">
import { ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import type { FamilyInviteContract, FamilyMemberContract } from "@baby-companion/contracts";
import { authApi } from "@/api/auth-api";
import { useAppStore } from "@/stores/app";

const store = useAppStore();
const familyName = ref("");
const saving = ref(false);
const inviteLoading = ref(false);
const invite = ref<FamilyInviteContract | null>(null);
const membersLoading = ref(false);
const members = ref<FamilyMemberContract[]>([]);

onLoad(async () => {
  await store.bootstrap();
  familyName.value = store.family?.name || "";
  await loadFamilyMembers();
});

async function loadFamilyMembers(): Promise<void> {
  if (!store.family) return;
  membersLoading.value = true;
  try {
    members.value = await authApi.getFamilyMembers(store.family.id);
  } catch (error) {
    uni.showToast({ title: error instanceof Error ? error.message : "成员加载失败", icon: "none" });
  } finally {
    membersLoading.value = false;
  }
}

function getRoleLabel(role: FamilyMemberContract["role"]): string {
  if (role === "ADMIN") return "家庭管理员";
  if (role === "PARENT") return "爸爸妈妈";
  return "家庭成员";
}

async function createInvite(): Promise<void> {
  if (!store.family) return;
  inviteLoading.value = true;
  try {
    invite.value = await authApi.createFamilyInvite(store.family.id);
  } catch (error) {
    uni.showToast({ title: error instanceof Error ? error.message : "生成失败", icon: "none" });
  } finally {
    inviteLoading.value = false;
  }
}

function copyInviteCode(): void {
  if (!invite.value) return;
  uni.setClipboardData({
    data: invite.value.code,
    success: () => uni.showToast({ title: "邀请码已复制", icon: "success" }),
  });
}

function formatExpiresAt(value: string): string {
  const date = new Date(value);
  return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

async function submit(): Promise<void> {
  if (!familyName.value.trim()) {
    uni.showToast({ title: "请填写家庭名称", icon: "none" });
    return;
  }
  saving.value = true;
  try {
    await store.saveFamily(familyName.value);
    uni.showToast({ title: "家庭信息已保存", icon: "success" });
    setTimeout(() => uni.navigateBack(), 500);
  } catch (error) {
    uni.showToast({ title: error instanceof Error ? error.message : "保存失败", icon: "none" });
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <view :class="['page-shell', 'family-profile', store.themeClass]">
    <view class="family-profile__hero">
      <image class="family-profile__hero-paper" src="/static/journal/card-bg.webp" mode="scaleToFill" />
      <view class="family-profile__hero-content">
        <image class="family-profile__hero-house" src="/static/journal/icon_53.webp" mode="aspectFit" />
        <text class="family-profile__hero-label">家 · 庭 · 档 · 案</text>
        <text class="family-profile__title">{{ familyName || "宝宝的小家" }}</text>
        <view class="family-profile__subtitle-row">
          <image class="family-profile__subtitle-leaf" src="/static/journal/icon_20.webp" mode="aspectFit" />
          <text class="family-profile__subtitle">一家人一起记录，数据只在家庭内可见</text>
        </view>
      </view>
    </view>

    <view class="surface-card family-profile__form">
      <image class="family-profile__card-tape" src="/static/journal/icon_35.webp" mode="aspectFit" />
      <view class="family-profile__section-heading">
        <text class="family-profile__section-title">小家资料</text>
        <text class="family-profile__section-note">记录属于你们的小家</text>
      </view>
      <wd-input v-model="familyName" label="家庭名称" placeholder="例如：宝宝的家" required clearable />
      <wd-cell title="我的角色" :value="store.family?.role === 'ADMIN' ? '管理员' : '家庭成员'" />
      <wd-cell title="家庭成员" :value="membersLoading ? '加载中…' : `${members.length} 人`" />
    </view>

    <view class="surface-card family-profile__members">
      <view class="family-profile__members-header">
        <view class="family-profile__members-heading">
          <image class="family-profile__heading-leaf" src="/static/journal/icon_20.webp" mode="aspectFit" />
          <text class="family-profile__members-title">和谁一起记录成长</text>
        </view>
        <text class="family-profile__members-count">{{ members.length }} 人</text>
      </view>
      <wd-cell-group v-if="members.length" border>
        <wd-cell
          v-for="member in members"
          :key="member.userId"
          :title="member.nickname || '家人'"
          :label="getRoleLabel(member.role)"
          :value="member.userId === store.user?.id ? '我' : ''"
        >
          <template #icon>
            <view class="family-profile__member-avatar">
              <image
                v-if="member.avatarUrl"
                class="family-profile__member-photo"
                :src="member.avatarUrl"
                mode="aspectFill"
              />
              <image v-else class="family-profile__member-icon" src="/static/journal/icon_47.webp" mode="aspectFit" />
            </view>
          </template>
        </wd-cell>
      </wd-cell-group>
      <wd-skeleton v-else-if="membersLoading" theme="paragraph" animation="gradient" :row-col="[1, 1]" />
      <view v-else class="family-profile__members-empty">
        <image class="family-profile__members-empty-icon" src="/static/journal/icon_47.webp" mode="aspectFit" />
        <text>暂时没有可显示的家庭成员</text>
      </view>
    </view>

    <view v-if="store.family?.role === 'ADMIN'" class="surface-card family-profile__invite">
      <image class="family-profile__invite-tape" src="/static/journal/icon_35.webp" mode="aspectFit" />
      <view class="family-profile__invite-heading">
        <view>
          <text class="family-profile__invite-title">邀请家人加入</text>
          <text class="family-profile__invite-description">生成后将自动撤销旧邀请码，新邀请码 7 天内有效。</text>
        </view>
        <image class="family-profile__invite-leaf" src="/static/journal/icon_20.webp" mode="aspectFit" />
      </view>
      <view v-if="invite" class="family-profile__invite-code" @click="copyInviteCode">
        <text>{{ invite.code }}</text>
        <wd-icon name="copy" size="18px" color="var(--color-primary)" />
      </view>
      <text v-if="invite" class="family-profile__invite-expiry">
        有效期至 {{ formatExpiresAt(invite.expiresAt) }} · 点击邀请码复制
      </text>
      <view class="family-profile__invite-action">
        <wd-button block :plain="Boolean(invite)" :loading="inviteLoading" @click="createInvite">
          {{ invite ? "重新生成邀请码" : "生成家庭邀请码" }}
        </wd-button>
      </view>
    </view>

    <view class="family-profile__notice">
      <view class="family-profile__notice-icon">🔒</view>
      <text class="family-profile__notice-text">家庭资料、成员关系和成长记录均已按 familyId 隔离，每次访问都会校验成员关系。</text>
    </view>

    <view class="family-profile__actions">
      <wd-button block size="large" :loading="saving" @click="submit">保存家庭信息</wd-button>
    </view>
  </view>
</template>

<style scoped lang="scss">
.family-profile {
  --wot-button-primary-bg-color: var(--color-primary);
  --wot-button-primary-color: var(--color-surface-muted);
  --wot-button-plain-bg-color: var(--color-surface-muted);
  --wot-button-large-height: 82rpx;
  --wot-button-large-radius: 20rpx;
  --wot-button-large-fs: 28rpx;
  --wot-cell-bg: transparent;
  --wot-cell-border-color: var(--color-divider);
  --wot-cell-title-color: var(--color-text);
  --wot-cell-value-color: var(--color-text-secondary);
  --wot-input-bg: transparent;

  &__hero {
    position: relative;
    display: flex;
    min-height: 340rpx;
    padding: 54rpx 48rpx 42rpx;
    overflow: hidden;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  &__hero-paper {
    position: absolute;
    z-index: 0;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  &__hero-content {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    flex-direction: column;
  }

  &__hero-house {
    width: 112rpx;
    height: 104rpx;
  }

  &__hero-label {
    margin-top: 2rpx;
    color: var(--color-primary-strong);
    font-size: 20rpx;
    font-weight: 700;
    letter-spacing: 5rpx;
  }

  &__title {
    margin-top: 4rpx;
    font-family: "STKaiti", "KaiTi", serif;
    font-size: 42rpx;
    font-weight: 800;
    letter-spacing: 2rpx;
  }

  &__subtitle-row {
    display: flex;
    margin-top: 8rpx;
    align-items: center;
    justify-content: center;
  }

  &__subtitle {
    color: var(--color-text-secondary);
    font-size: 22rpx;
  }

  &__subtitle-leaf {
    width: 34rpx;
    height: 34rpx;
    margin-right: 8rpx;
    transform: rotate(-18deg);
  }

  &__form {
    position: relative;
    margin-top: 12rpx;
    padding: 40rpx 24rpx 10rpx;
    border-radius: 18rpx;
    background: var(--color-surface-muted);
  }

  &__card-tape {
    position: absolute;
    top: -22rpx;
    left: 44rpx;
    width: 120rpx;
    height: 52rpx;
    transform: rotate(-5deg);
  }

  &__section-heading {
    display: flex;
    margin: 0 16rpx 12rpx;
    align-items: baseline;
    justify-content: space-between;
  }

  &__section-title {
    font-family: "STKaiti", "KaiTi", serif;
    font-size: 32rpx;
    font-weight: 800;
  }

  &__section-note {
    color: var(--color-text-placeholder);
    font-size: 20rpx;
  }

  &__notice {
    display: flex;
    margin-top: 24rpx;
    padding: 22rpx 24rpx;
    align-items: flex-start;
    border: 1rpx dashed var(--color-border);
    border-radius: 18rpx;
    color: var(--color-text-secondary);
    background: var(--color-surface-muted);
    font-size: 22rpx;
    line-height: 1.6;
  }

  &__invite {
    position: relative;
    margin-top: 24rpx;
    padding: 34rpx 28rpx 28rpx;
    border-radius: 18rpx;
    background: var(--color-surface-muted);
  }

  &__members {
    margin-top: 24rpx;
    padding: 28rpx 24rpx 20rpx;
    border-radius: 18rpx;
    background: var(--color-surface-muted);
  }

  &__members-header {
    display: flex;
    margin-bottom: 16rpx;
    align-items: center;
    justify-content: space-between;
  }

  &__members-heading {
    display: flex;
    align-items: center;
  }

  &__heading-leaf {
    width: 42rpx;
    height: 42rpx;
    margin-right: 10rpx;
    transform: rotate(-22deg);
  }

  &__members-title {
    font-family: "STKaiti", "KaiTi", serif;
    font-size: 32rpx;
    font-weight: 800;
  }

  &__members-count {
    color: var(--color-text-secondary);
    font-size: 23rpx;
  }

  &__member-icon {
    width: 58rpx;
    height: 58rpx;
  }

  &__member-avatar {
    display: flex;
    width: 66rpx;
    height: 66rpx;
    margin-right: 16rpx;
    overflow: hidden;
    align-items: center;
    justify-content: center;
    border: 3rpx solid var(--color-surface);
    border-radius: 50%;
    background: var(--color-primary-soft);
    box-shadow: var(--shadow-card);
  }

  &__member-photo {
    width: 100%;
    height: 100%;
  }

  &__members-empty {
    display: flex;
    padding: 38rpx 0 28rpx;
    align-items: center;
    flex-direction: column;
    color: var(--color-text-placeholder);
    font-size: 22rpx;
  }

  &__members-empty-icon {
    width: 86rpx;
    height: 86rpx;
    margin-bottom: 10rpx;
  }

  &__invite-title {
    display: block;
    font-family: "STKaiti", "KaiTi", serif;
    font-size: 32rpx;
    font-weight: 800;
  }

  &__invite-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__invite-leaf {
    width: 72rpx;
    height: 72rpx;
    margin-left: 18rpx;
    flex-shrink: 0;
    transform: rotate(8deg);
  }

  &__invite-tape {
    position: absolute;
    top: -22rpx;
    right: 54rpx;
    width: 112rpx;
    height: 48rpx;
    transform: rotate(6deg);
  }

  &__invite-description,
  &__invite-expiry {
    display: block;
    color: var(--color-text-secondary);
    font-size: 22rpx;
  }

  &__invite-description {
    margin-top: 10rpx;
  }

  &__invite-code {
    display: flex;
    margin: 24rpx 0 10rpx;
    padding: 20rpx 24rpx;
    align-items: center;
    justify-content: center;
    gap: 18rpx;
    border: 1rpx dashed var(--color-primary);
    border-radius: 16rpx;
    color: var(--color-primary-strong);
    background: var(--color-primary-soft);
    font-family: "STKaiti", "KaiTi", serif;
    font-size: 38rpx;
    font-weight: 800;
    letter-spacing: 4rpx;
  }

  &__invite-expiry {
    text-align: center;
  }

  &__invite-action {
    margin-top: 28rpx;
  }

  &__notice-icon {
    display: flex;
    width: 44rpx;
    height: 44rpx;
    margin-right: 12rpx;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: var(--color-primary-soft);
    font-size: 22rpx;
  }

  &__notice-text {
    flex: 1;
  }

  &__actions {
    margin-top: 24rpx;
  }
}
</style>
