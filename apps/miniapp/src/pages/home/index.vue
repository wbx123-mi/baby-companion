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
    <view class="home-title-art">
      <image class="home-title-art__moon" src="/static/journal/03_moon_stars.webp" mode="aspectFit" />
      <image class="home-title-art__single-leaf" src="/static/journal/13_single_leaf.webp" mode="aspectFit" />
      <image class="home-title-art__leaf-sprig" src="/static/journal/10_leaf_sprig_mid.webp" mode="aspectFit" />
      <image class="home-title-art__title" src="/static/journal/01_title_growth_book.webp" mode="aspectFit" />
      <image class="home-title-art__subtitle" src="/static/journal/02_subtitle_record_today.webp" mode="aspectFit" />
    </view>
    <view class="home-kv">
      <view v-if="hasFamily" class="home-kv__milestone">
        <text class="home-kv__eyebrow">
          {{ greeting }}，{{ store.user?.nickname || "家人" }}
        </text>
        <view class="home-kv__portrait-wrap">
          <image class="home-kv__portrait" src="/static/journal/04_baby_portrait_frame.webp" mode="aspectFit" />
          <image class="home-kv__heart" src="/static/journal/07_heart_doodle.webp" mode="aspectFit" />
        </view>
        <image class="home-kv__today" src="/static/journal/05_today_ribbon.webp" mode="aspectFit" />
        <view class="home-kv__age-row">
          <image class="home-kv__age-leaf home-kv__age-leaf--left" src="/static/journal/10_leaf_sprig_mid.webp" mode="aspectFit" />
          <text class="home-kv__age">{{ calculateAgeText(store.baby?.birthDate || "") }}</text>
          <image class="home-kv__age-leaf home-kv__age-leaf--right" src="/static/journal/10_leaf_sprig_mid.webp" mode="aspectFit" />
        </view>
        <text class="home-kv__milestone-note">陪 {{ store.baby?.nickname }} 把每个普通日子好好收藏</text>
      </view>
      <view v-else class="home-kv__content">
        <text class="home-kv__eyebrow">{{ greeting }}</text>
        <text class="home-kv__title">把爱留在每一个平常日子</text>
        <text class="home-kv__subtitle">创建或加入一个家庭，一起收藏宝宝的成长故事</text>
        <view class="home-kv__illustration">
          <image class="home-kv__family" src="/static/journal/icon_53.webp" mode="aspectFit" />
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
            <image v-else class="home-family__avatar-placeholder" src="/static/journal/icon_01.webp" mode="aspectFit" />
          </view>
          <view class="home-family__identity">
            <text class="home-family__name">{{ store.baby?.nickname }}</text>
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
          <image class="home-quick-card__art" src="/static/journal/story11.webp" mode="aspectFit" />
        </view>
        <view class="home-quick-card" @click="navigate('/pages/baby/profile/index')">
          <image class="home-quick-card__art" src="/static/journal/baby11.webp" mode="aspectFit" />
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
        <image class="home-entry__privacy-icon" src="/static/journal/icon_20.webp" mode="aspectFit" />
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

.home-title-art {
  position: relative;
  display: flex;
  min-height: 310rpx;
  align-items: center;
  flex-direction: column;
  justify-content: center;

  &__title {
    position: relative;
    z-index: 1;
    width: 488rpx;
    height: 210rpx;
    transform: translate(-30rpx, -14rpx);
  }

  &__subtitle {
    position: relative;
    z-index: 2;
    width: 370rpx;
    height: 118rpx;
    margin-top: -66rpx;
    transform: rotate(-2deg);
  }

  &__moon,
  &__single-leaf,
  &__leaf-sprig {
    position: absolute;
    z-index: 0;
  }

  &__moon {
    top: 38rpx;
    right: -2rpx;
    width: 112rpx;
    height: 122rpx;
  }

  &__single-leaf {
    bottom: 42rpx;
    left: 10rpx;
    width: 42rpx;
    height: 74rpx;
    transform: rotate(-10deg);
  }

  &__leaf-sprig {
    right: 22rpx;
    bottom: 8rpx;
    width: 94rpx;
    height: 98rpx;
    transform: rotate(8deg);
  }
}

.home-kv {
  position: relative;
  min-height: 480rpx;
  margin: 10rpx 34rpx 0;
  border: 1rpx solid rgba(165, 139, 117, 0.18);
  border-radius: 18rpx;
  background: rgba(255, 252, 246, 0.9);
  box-shadow: 0 12rpx 28rpx rgba(112, 84, 64, 0.12);


  &__content {
    position: relative;
    display: flex;
    min-height: 480rpx;
    padding: 76rpx 42rpx 38rpx;
    flex-direction: column;
  }

  &__eyebrow {
    color: var(--color-primary-strong);
    font-size: 24rpx;
    font-weight: 700;
  }

  &__title {
    width: 76%;
    margin-top: 18rpx;
    font-family: "STKaiti", "KaiTi", serif;
    font-size: 42rpx;
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
    width: 210rpx;
    height: 150rpx;
    align-items: center;
    justify-content: center;
    background: transparent;
    transform: rotate(-3deg);
  }

  &__family {
    width: 100%;
    height: 100%;
  }

  &__milestone {
    position: relative;
    display: flex;
    min-height: 480rpx;
    padding: 24rpx 32rpx 20rpx;
    align-items: center;
    flex-direction: column;
  }

  &__milestone &__eyebrow {
    position: absolute;
    top: 30rpx;
    left: 34rpx;
    color: var(--color-text-secondary);
    font-size: 20rpx;
    font-weight: 500;
    letter-spacing: 2rpx;
  }

  &__portrait-wrap {
    position: relative;
    width: 276rpx;
    height: 232rpx;
    margin-top: 20rpx;
  }

  &__portrait {
    width: 100%;
    height: 100%;
  }

  &__heart {
    position: absolute;
    top: 44rpx;
    right: -26rpx;
    width: 52rpx;
    height: 52rpx;
    transform: rotate(9deg);
  }

  &__today {
    position: relative;
    z-index: 2;
    width: 150rpx;
    height: 56rpx;
    margin-top: -24rpx;
  }

  &__age-row {
    display: flex;
    margin-top: 0;
    align-items: center;
    justify-content: center;
  }

  &__age {
    margin: 0 14rpx;
    color: #49382f;
    font-family: "STKaiti", "KaiTi", serif;
    font-size: 62rpx;
    font-weight: 700;
    letter-spacing: 3rpx;
    line-height: 1.2;
  }

  &__age-leaf {
    width: 44rpx;
    height: 44rpx;

    &--left {
      transform: rotate(-28deg);
    }

    &--right {
      transform: rotate(152deg);
    }
  }

  &__milestone-note {
    margin-top: 2rpx;
    color: var(--color-text-secondary);
    font-size: 20rpx;
    letter-spacing: 1rpx;
  }
}

.home-family,
.home-entry {
  margin-top: 24rpx;
}

.home-family {
  border-radius: 18rpx;
  background: rgba(255, 252, 246, 0.9);
  --wot-button-primary-bg-color: var(--color-primary);
  --wot-button-primary-color: #fffaf6;
  --wot-button-plain-bg-color: rgba(255, 252, 246, 0.72);
  --wot-button-large-height: 76rpx;
  --wot-button-large-radius: 18rpx;
  --wot-button-large-fs: 28rpx;
  --wot-tag-warning-color: var(--color-primary-strong);
  --wot-tag-fs: 21rpx;

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
    border: 4rpx solid rgba(255, 255, 255, 0.9);
    border-radius: 50%;
    background: var(--color-primary-soft);
    font-size: 44rpx;
    box-shadow: 0 4rpx 12rpx rgba(112, 84, 64, 0.1);
  }

  &__avatar-image {
    width: 100%;
    height: 100%;
  }

  &__avatar-placeholder {
    width: 74rpx;
    height: 74rpx;
  }

  &__identity {
    display: flex;
    min-width: 0;
    flex: 1;
    flex-direction: column;
    justify-content: center;
  }

  &__name {
    font-family: "STKaiti", "KaiTi", serif;
    font-size: 34rpx;
    font-weight: 800;
  }

  &__actions {
    display: grid;
    margin-top: 24rpx;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14rpx;
  }
}

.home-quick-card {
  display: flex;
  min-height: 0;
  padding: 0;
  align-items: center;
  flex-direction: column;
  border: 0;
  background: transparent;

  &__art {
    width: 100%;
    height: 390rpx;
  }
}

.home-entry {
  padding: 30rpx 28rpx 24rpx;
  border-radius: 18rpx;
  background: var(--color-surface-muted);
  --wot-button-primary-bg-color: var(--color-primary);
  --wot-button-primary-color: var(--color-surface-muted);
  --wot-button-plain-bg-color: var(--color-surface-muted);
  --wot-button-large-height: 76rpx;
  --wot-button-large-radius: 18rpx;
  --wot-button-large-fs: 28rpx;

  &__title {
    display: block;
    font-family: "STKaiti", "KaiTi", serif;
    font-size: 32rpx;
    font-weight: 800;
    letter-spacing: 1rpx;
  }

  &__description {
    display: block;
    margin-top: 8rpx;
    color: var(--color-text-secondary);
    font-size: 23rpx;
  }

  &__actions {
    display: grid;
    margin-top: 26rpx;
    gap: 14rpx;
  }

  &__privacy {
    display: flex;
    margin-top: 24rpx;
    padding-top: 20rpx;
    align-items: center;
    justify-content: center;
    border-top: 1rpx solid var(--color-divider);
    color: var(--color-text-placeholder);
    font-size: 22rpx;
  }

  &__privacy-icon {
    width: 32rpx;
    height: 32rpx;
    margin-right: 10rpx;
  }
}
</style>
