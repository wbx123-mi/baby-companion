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
      <text class="family-profile__emoji">🏠</text>
      <text class="family-profile__title">{{ familyName || "宝宝的小家" }}</text>
      <text class="family-profile__subtitle">一家人一起记录，数据只在家庭内可见</text>
    </view>

    <view class="surface-card family-profile__form">
      <wd-input v-model="familyName" label="家庭名称" placeholder="例如：小满的家" required clearable />
      <wd-cell title="我的角色" :value="store.family?.role === 'ADMIN' ? '管理员' : '家庭成员'" />
      <wd-cell title="家庭成员" :value="membersLoading ? '加载中…' : `${members.length} 人`" />
    </view>

    <view class="surface-card family-profile__members">
      <view class="family-profile__members-header">
        <text class="family-profile__members-title">和谁一起记录成长</text>
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
          <template #icon><text class="family-profile__member-icon">🙋🏻</text></template>
        </wd-cell>
      </wd-cell-group>
      <wd-skeleton v-else-if="membersLoading" theme="paragraph" animation="gradient" :row-col="[1, 1]" />
      <wd-status-tip v-else image="content" tip="暂时没有可显示的家庭成员" />
    </view>

    <view v-if="store.family?.role === 'ADMIN'" class="surface-card family-profile__invite">
      <text class="family-profile__invite-title">邀请家人加入</text>
      <text class="family-profile__invite-description">生成后将自动撤销旧邀请码，新邀请码 7 天内有效。</text>
      <view v-if="invite" class="family-profile__invite-code" @click="copyInviteCode">
        <text>{{ invite.code }}</text>
        <wd-icon name="copy" size="18px" color="var(--color-primary)" />
      </view>
      <text v-if="invite" class="family-profile__invite-expiry">
        有效期至 {{ formatExpiresAt(invite.expiresAt) }} · 点击邀请码复制
      </text>
      <wd-button block :plain="Boolean(invite)" :loading="inviteLoading" @click="createInvite">
        {{ invite ? "重新生成邀请码" : "生成家庭邀请码" }}
      </wd-button>
    </view>

    <view class="family-profile__notice">
      <text class="family-profile__notice-icon">🔒</text>
      <text>正式后端会按 familyId 做数据隔离，并在每次访问时校验家庭成员关系。</text>
    </view>

    <view class="family-profile__actions">
      <wd-button block size="large" :loading="saving" @click="submit">保存家庭信息</wd-button>
    </view>
  </view>
</template>

<style scoped lang="scss">
.family-profile {
  &__hero {
    display: flex;
    padding: 44rpx 28rpx;
    flex-direction: column;
    align-items: center;
    border-radius: 32rpx;
    background: var(--gradient-hero);
    box-shadow: var(--shadow-card);
  }

  &__emoji {
    font-size: 74rpx;
  }

  &__title {
    margin-top: 12rpx;
    font-size: 38rpx;
    font-weight: 800;
  }

  &__subtitle {
    margin-top: 6rpx;
    color: var(--color-text-secondary);
    font-size: 22rpx;
  }

  &__form {
    margin-top: 24rpx;
    padding: 10rpx 24rpx;
  }

  &__notice {
    display: flex;
    margin-top: 24rpx;
    padding: 24rpx;
    align-items: flex-start;
    border-radius: 20rpx;
    color: var(--color-text-secondary);
    background: var(--color-primary-soft);
    font-size: 23rpx;
    line-height: 1.6;
  }

  &__invite {
    margin-top: 24rpx;
  }

  &__members {
    margin-top: 24rpx;
    padding: 22rpx;
  }

  &__members-header {
    display: flex;
    margin-bottom: 16rpx;
    align-items: center;
    justify-content: space-between;
  }

  &__members-title {
    font-size: 30rpx;
    font-weight: 800;
  }

  &__members-count {
    color: var(--color-text-secondary);
    font-size: 23rpx;
  }

  &__member-icon {
    margin-right: 16rpx;
    font-size: 32rpx;
  }

  &__invite-title {
    display: block;
    font-size: 30rpx;
    font-weight: 800;
  }

  &__invite-description,
  &__invite-expiry {
    display: block;
    color: var(--color-text-secondary);
    font-size: 22rpx;
  }

  &__invite-description {
    margin-top: 8rpx;
  }

  &__invite-code {
    display: flex;
    margin: 24rpx 0 10rpx;
    padding: 24rpx;
    align-items: center;
    justify-content: center;
    gap: 18rpx;
    border: 1rpx dashed var(--color-primary);
    border-radius: 20rpx;
    color: var(--color-primary-strong);
    background: var(--color-primary-soft);
    font-size: 36rpx;
    font-weight: 800;
    letter-spacing: 4rpx;
  }

  &__invite-expiry {
    margin-bottom: 20rpx;
    text-align: center;
  }

  &__notice-icon {
    margin-right: 14rpx;
  }

  &__actions {
    margin-top: 28rpx;
  }
}
</style>
