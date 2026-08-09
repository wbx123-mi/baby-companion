<script setup lang="ts">
import { computed, ref } from "vue";
import { onPullDownRefresh, onShow } from "@dcloudio/uni-app";
import { useAppStore } from "@/stores/app";
import { calculateAgeText } from "@/utils/date";

const store = useAppStore();
const refreshing = ref(false);
const hasFamily = computed(() => Boolean(store.family && store.baby));
const greeting = computed(() => {
  if (!hasFamily.value) return "欢迎来到宝宝的成长簿";
  const hour = new Date().getHours();
  if (hour < 11) return "早上好";
  if (hour < 18) return "下午好";
  return "晚上好";
});

async function refresh(): Promise<void> {
  refreshing.value = true;
  try {
    await store.bootstrap(true);
  } finally {
    refreshing.value = false;
  }
}

onShow(() => {
  void refresh();
});

onPullDownRefresh(async () => {
  try {
    await refresh();
  } finally {
    uni.stopPullDownRefresh();
  }
});

function navigate(url: string): void {
  uni.navigateTo({ url });
}

function openGrowth(): void {
  uni.switchTab({ url: "/pages/growth/index" });
}
</script>

<template>
  <view :class="['page-shell', 'home-page', store.themeClass]">
    <view class="home-kv">
      <view class="home-kv__glow home-kv__glow--large" />
      <view class="home-kv__glow home-kv__glow--small" />
      <view class="home-kv__content">
        <text class="home-kv__eyebrow">
          {{ hasFamily ? `${greeting}，${store.user?.nickname || "家人"}` : greeting }}
        </text>
        <text class="home-kv__title">
          {{ hasFamily ? `陪 ${store.baby?.nickname} 慢慢长大` : "把爱留在每一个平常日子" }}
        </text>
        <text class="home-kv__subtitle">
          {{ hasFamily ? "今天也值得被好好记录" : "创建或加入一个家庭，一起收藏宝宝的成长故事" }}
        </text>
        <view class="home-kv__illustration">
          <view class="home-kv__family">{{ hasFamily ? "👨‍👩‍👧" : "🏡" }}</view>
          <view class="home-kv__heart">❤</view>
        </view>
      </view>
    </view>

    <view v-if="refreshing && !store.bootstrapData" class="home-page__loading">
      <wd-loading size="24px" color="var(--color-primary)" />
      <text>正在准备你的小家…</text>
    </view>

    <template v-else-if="hasFamily">
      <view class="home-family surface-card">
        <view class="home-family__header">
          <view class="home-family__avatar">
            <image v-if="store.baby?.avatarUrl" class="home-family__avatar-image" :src="store.baby.avatarUrl" mode="aspectFill" />
            <text v-else>👶🏻</text>
          </view>
          <view class="home-family__identity">
            <text class="home-family__name">{{ store.baby?.nickname }}</text>
            <text class="home-family__age">{{ calculateAgeText(store.baby?.birthDate || "") }}</text>
          </view>
          <wd-tag type="warning" plain>{{ store.family?.name }}</wd-tag>
        </view>
        <view class="home-family__actions">
          <wd-button block size="large" @click="navigate('/pages/record/edit/index')">记录这一刻</wd-button>
          <wd-button block size="large" plain @click="navigate('/pages/family/profile/index')">查看家庭</wd-button>
        </view>
      </view>

      <view class="home-page__quick-grid">
        <view class="home-quick-card" @click="openGrowth">
          <text class="home-quick-card__icon">📖</text>
          <text class="home-quick-card__title">成长故事</text>
          <text class="home-quick-card__description">翻看家人留下的珍贵片段</text>
        </view>
        <view class="home-quick-card" @click="navigate('/pages/baby/profile/index')">
          <text class="home-quick-card__icon">🌱</text>
          <text class="home-quick-card__title">宝宝档案</text>
          <text class="home-quick-card__description">看看宝宝来到世界多久了</text>
        </view>
      </view>
    </template>

    <view v-else class="home-entry surface-card">
      <text class="home-entry__title">开启你们的家庭空间</text>
      <text class="home-entry__description">家庭内的成员才能看到宝宝档案和成长记录。</text>
      <view class="home-entry__actions">
        <wd-button block size="large" @click="navigate('/pages/onboarding/index')">创建家庭</wd-button>
        <wd-button block size="large" plain @click="navigate('/pages/join-family/index')">使用邀请码加入</wd-button>
      </view>
      <view class="home-entry__privacy">
        <text class="home-entry__privacy-icon">🔒</text>
        <text>这是只属于家人的私密成长簿</text>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.home-page {
  &__loading {
    display: flex;
    padding: 64rpx 0;
    align-items: center;
    justify-content: center;
    gap: 16rpx;
    color: var(--color-text-secondary);
    font-size: 24rpx;
  }

  &__quick-grid {
    display: grid;
    margin-top: 24rpx;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20rpx;
  }
}

.home-kv {
  position: relative;
  overflow: hidden;
  min-height: 520rpx;
  border: 1rpx solid var(--color-border);
  border-radius: 36rpx;
  background: var(--gradient-hero);
  box-shadow: var(--shadow-card);

  &__glow {
    position: absolute;
    border-radius: 50%;
    background: var(--color-surface);
    opacity: 0.42;

    &--large {
      top: -150rpx;
      right: -110rpx;
      width: 360rpx;
      height: 360rpx;
    }

    &--small {
      right: 190rpx;
      bottom: 76rpx;
      width: 96rpx;
      height: 96rpx;
      opacity: 0.28;
    }
  }

  &__content {
    position: relative;
    display: flex;
    height: 520rpx;
    padding: 46rpx 40rpx;
    flex-direction: column;
  }

  &__eyebrow {
    color: var(--color-primary-strong);
    font-size: 24rpx;
    font-weight: 700;
  }

  &__title {
    width: 82%;
    margin-top: 18rpx;
    font-size: 46rpx;
    font-weight: 800;
    line-height: 1.28;
  }

  &__subtitle {
    width: 76%;
    margin-top: 18rpx;
    color: var(--color-text-secondary);
    font-size: 25rpx;
    line-height: 1.7;
  }

  &__illustration {
    position: absolute;
    right: 36rpx;
    bottom: 24rpx;
    display: flex;
    width: 240rpx;
    height: 178rpx;
    align-items: center;
    justify-content: center;
    border-radius: 48% 48% 30% 30%;
    background: var(--color-surface);
    box-shadow: var(--shadow-card);
    transform: rotate(-3deg);
  }

  &__family {
    font-size: 86rpx;
  }

  &__heart {
    position: absolute;
    top: -16rpx;
    right: 18rpx;
    color: var(--color-primary);
    font-size: 40rpx;
  }
}

.home-family,
.home-entry {
  margin-top: 24rpx;
}

.home-family {
  &__header {
    display: flex;
    align-items: center;
    gap: 18rpx;
  }

  &__avatar {
    display: flex;
    width: 88rpx;
    height: 88rpx;
    overflow: hidden;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: var(--color-primary-soft);
    font-size: 44rpx;
  }

  &__avatar-image {
    width: 100%;
    height: 100%;
  }

  &__identity {
    display: flex;
    min-width: 0;
    flex: 1;
    flex-direction: column;
  }

  &__name {
    font-size: 32rpx;
    font-weight: 800;
  }

  &__age {
    margin-top: 4rpx;
    color: var(--color-text-secondary);
    font-size: 23rpx;
  }

  &__actions {
    display: grid;
    margin-top: 28rpx;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16rpx;
  }
}

.home-quick-card {
  display: flex;
  min-height: 228rpx;
  padding: 26rpx;
  flex-direction: column;
  border: 1rpx solid var(--color-border);
  border-radius: 26rpx;
  background: var(--color-surface);
  box-shadow: var(--shadow-card);

  &__icon {
    font-size: 42rpx;
  }

  &__title {
    margin-top: 18rpx;
    font-size: 28rpx;
    font-weight: 800;
  }

  &__description {
    margin-top: 8rpx;
    color: var(--color-text-secondary);
    font-size: 22rpx;
    line-height: 1.55;
  }
}

.home-entry {
  &__title {
    display: block;
    font-size: 32rpx;
    font-weight: 800;
  }

  &__description {
    display: block;
    margin-top: 10rpx;
    color: var(--color-text-secondary);
    font-size: 24rpx;
  }

  &__actions {
    display: grid;
    margin-top: 30rpx;
    gap: 18rpx;
  }

  &__privacy {
    display: flex;
    margin-top: 28rpx;
    padding-top: 22rpx;
    align-items: center;
    justify-content: center;
    border-top: 1rpx solid var(--color-divider);
    color: var(--color-text-placeholder);
    font-size: 22rpx;
  }

  &__privacy-icon {
    margin-right: 10rpx;
  }
}
</style>
