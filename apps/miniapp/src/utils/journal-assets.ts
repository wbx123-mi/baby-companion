const JOURNAL_ASSET_BASE_URL = (import.meta.env.VITE_ASSET_BASE_URL || "").replace(/\/+$/, "");
const LOCAL_JOURNAL_ASSET_BASE_URL = "/static/journal";

/**
 * 统一生成手帐素材地址。
 * 未配置远程地址时使用小程序本地素材，便于本地开发和域名备案期间预览。
 */
export function journalAsset(filename: string): string {
  const normalizedFilename = filename.replace(/^\/+/, "");
  const baseUrl = JOURNAL_ASSET_BASE_URL || LOCAL_JOURNAL_ASSET_BASE_URL;
  return `${baseUrl}/${normalizedFilename}`;
}

export const isRemoteJournalAssetsEnabled = Boolean(JOURNAL_ASSET_BASE_URL);
