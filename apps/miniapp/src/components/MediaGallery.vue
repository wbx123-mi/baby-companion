<script setup lang="ts">
import type { MediaAsset } from "@/types/domain";

defineProps<{
  assets: MediaAsset[];
  compact?: boolean;
}>();

function preview(asset: MediaAsset, assets: MediaAsset[]): void {
  const urls = assets.map((item) => item.localPath || item.url).filter(Boolean) as string[];
  const current = asset.localPath || asset.url;
  if (!current || urls.length === 0) return;
  uni.previewImage({ current, urls });
}
</script>

<template>
  <view v-if="assets.length" :class="['media-gallery', { 'media-gallery--compact': compact }]">
    <view
      v-for="asset in assets.slice(0, compact ? 1 : 9)"
      :key="asset.id"
      :class="['media-gallery__item', `media-gallery__item--${asset.mockTheme || 'local'}`]"
      @click.stop="preview(asset, assets)"
    >
      <wd-img
        v-if="asset.localPath || asset.url"
        :src="asset.localPath || asset.url || ''"
        width="100%"
        height="100%"
        mode="aspectFill"
        :enable-preview="false"
      />
      <view v-else class="media-gallery__placeholder">
        <text class="media-gallery__emoji">{{ asset.mockEmoji || "📷" }}</text>
        <text class="media-gallery__caption">照片将在这里留下</text>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.media-gallery {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10rpx;
  margin-top: 18rpx;

  &--compact {
    display: block;
  }

  &__item {
    position: relative;
    height: 220rpx;
    overflow: hidden;
    border-radius: 20rpx;
    background: var(--gradient-sky);

    &--sun {
      background: var(--gradient-sun);
    }

    &--heart {
      background: var(--gradient-heart);
    }

    &--sky,
    &--local {
      background: var(--gradient-sky);
    }
  }

  &--compact &__item {
    height: 300rpx;
  }

  &__placeholder {
    display: flex;
    width: 100%;
    height: 100%;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: var(--color-text);
  }

  &__emoji {
    font-size: 72rpx;
    line-height: 1;
  }

  &__caption {
    margin-top: 18rpx;
    color: var(--color-text-secondary);
    font-size: 22rpx;
    letter-spacing: 2rpx;
  }
}
</style>
