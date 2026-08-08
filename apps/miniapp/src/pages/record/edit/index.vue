<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { RECORD_TYPE_OPTIONS } from "@/constants/records";
import { recordsApi } from "@/api/records-api";
import { mediaApi } from "@/api/media-api";
import { useAppStore } from "@/stores/app";
import MediaGallery from "@/components/MediaGallery.vue";
import type { MediaAsset, RecordType } from "@/types/domain";
import { toIsoDatetime, toLocalDatetimeValue } from "@/utils/date";

const store = useAppStore();
const recordId = ref<string>();
const saving = ref(false);
const uploading = ref(false);

const form = reactive({
  type: "DAILY" as RecordType,
  content: "",
  occurredAt: Date.now(),
  version: undefined as number | undefined,
  assets: [] as MediaAsset[],
});

const title = computed(() => (recordId.value ? "编辑成长记录" : "记录这一刻"));
const minDate = computed(() => {
  if (!store.baby) return new Date(2020, 0, 1).getTime();
  return new Date(`${store.baby.birthDate}T00:00:00+08:00`).getTime();
});

onLoad(async (query) => {
  await store.bootstrap();
  const id = String(query?.id || "");
  if (!id) return;

  recordId.value = id;
  uni.setNavigationBarTitle({ title: "编辑成长记录" });
  try {
    const record = await recordsApi.get(id);
    form.type = record.type;
    form.content = record.content;
    form.occurredAt = toLocalDatetimeValue(record.occurredAt);
    form.version = record.version;
    form.assets = record.assets;
  } catch (error) {
    uni.showToast({ title: error instanceof Error ? error.message : "记录加载失败", icon: "none" });
  }
});

async function submit(): Promise<void> {
  const content = form.content.trim();
  if (!content) {
    uni.showToast({ title: "写下一点关于这一刻的故事吧", icon: "none" });
    return;
  }
  if (content.length > 2000) {
    uni.showToast({ title: "内容不能超过 2000 字", icon: "none" });
    return;
  }

  saving.value = true;
  try {
    await store.saveRecord(recordId.value, {
      type: form.type,
      content,
      occurredAt: toIsoDatetime(form.occurredAt),
      assets: form.assets,
      version: form.version,
    });
    uni.showToast({ title: recordId.value ? "已保存" : "记录成功", icon: "success" });
    setTimeout(() => uni.navigateBack(), 500);
  } catch (error) {
    uni.showToast({ title: error instanceof Error ? error.message : "保存失败，请稍后重试", icon: "none" });
  } finally {
    saving.value = false;
  }
}

function chooseImages(): void {
  const remaining = 9 - form.assets.length;
  if (remaining <= 0) {
    uni.showToast({ title: "最多上传 9 张照片", icon: "none" });
    return;
  }
  uni.chooseImage({
    count: remaining,
    sizeType: ["compressed"],
    sourceType: ["album", "camera"],
    success: async ({ tempFilePaths }) => {
      if (!store.baby) return;
      uploading.value = true;
      uni.showLoading({ title: "正在上传照片" });
      try {
        const paths = Array.isArray(tempFilePaths) ? tempFilePaths : [tempFilePaths];
        const uploaded = await Promise.all(paths.map((filePath) => mediaApi.uploadImage(store.baby!.id, filePath)));
        form.assets.push(...uploaded);
      } catch (error) {
        uni.showToast({ title: error instanceof Error ? error.message : "图片上传失败", icon: "none" });
      } finally {
        uploading.value = false;
        uni.hideLoading();
      }
    },
  });
}

function removeAsset(assetId: string): void {
  const index = form.assets.findIndex((asset) => asset.id === assetId);
  if (index >= 0) form.assets.splice(index, 1);
}
</script>

<template>
  <view :class="['page-shell', 'record-editor', store.themeClass]">
    <view class="record-editor__intro">
      <text class="record-editor__title">{{ title }}</text>
      <text class="record-editor__hint">不用写得很完整，真实的一句话就很好。</text>
    </view>

    <view class="surface-card record-editor__form">
      <text class="record-editor__label">记录类型</text>
      <wd-radio-group v-model="form.type" shape="button" inline>
        <wd-radio v-for="option in RECORD_TYPE_OPTIONS" :key="option.value" :value="option.value">
          {{ option.emoji }} {{ option.label }}
        </wd-radio>
      </wd-radio-group>

      <view class="record-editor__field">
        <wd-textarea
          v-model="form.content"
          label="成长故事"
          placeholder="比如：今天第一次睁开眼认真看我们……"
          :maxlength="2000"
          show-word-limit
          auto-height
          required
        />
      </view>

      <view class="record-editor__field">
        <wd-datetime-picker
          v-model="form.occurredAt"
          type="datetime"
          label="发生时间"
          title="选择发生时间"
          :min-date="minDate"
          :max-date="Date.now()"
          required
        />
      </view>

      <view class="record-editor__media">
        <view class="record-editor__media-header">
          <text class="record-editor__label">成长照片（{{ form.assets.length }}/9）</text>
          <wd-button size="small" plain :loading="uploading" @click="chooseImages">添加照片</wd-button>
        </view>
        <MediaGallery :assets="form.assets" />
        <view v-if="form.assets.length" class="record-editor__media-actions">
          <wd-button v-for="asset in form.assets" :key="asset.id" size="small" type="info" plain @click="removeAsset(asset.id)">移除照片</wd-button>
        </view>
        <text v-else class="record-editor__media-tip">照片上传后，家庭成员可共同查看。</text>
      </view>
    </view>

    <view class="record-editor__actions">
      <wd-button block size="large" :loading="saving" @click="submit">
        {{ recordId ? "保存修改" : "保存成长记录" }}
      </wd-button>
    </view>
  </view>
</template>

<style scoped lang="scss">
.record-editor {
  &__intro {
    padding: 12rpx 8rpx 26rpx;
  }

  &__title,
  &__hint,
  &__label {
    display: block;
  }

  &__title {
    color: var(--color-text);
    font-size: 40rpx;
    font-weight: 800;
  }

  &__hint {
    margin-top: 8rpx;
    color: var(--color-text-secondary);
    font-size: 24rpx;
  }

  &__form {
    padding: 28rpx;
  }

  &__label {
    margin-bottom: 18rpx;
    color: var(--color-text);
    font-size: 27rpx;
    font-weight: 700;
  }

  &__field,
  &__media {
    margin-top: 28rpx;
    padding-top: 12rpx;
    border-top: 1rpx solid var(--color-divider);
  }

  &__media-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__media-tip {
    display: block;
    margin-top: 16rpx;
    padding: 18rpx;
    color: var(--color-text-placeholder);
    background: var(--color-surface-muted);
    border-radius: 18rpx;
    font-size: 21rpx;
  }

  &__media-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12rpx;
    margin-top: 16rpx;
  }

  &__actions {
    margin-top: 28rpx;
    padding-bottom: env(safe-area-inset-bottom);
  }
}
</style>
