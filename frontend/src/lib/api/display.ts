import { api } from "./client";
import type { Banner, BannerPosition, Notice, NoticeSummary, Page, StoreSettings } from "./types";

export const displayApi = {
  banners: (position: BannerPosition) => api.get<Banner[]>("/banners", { position }),
  notices: (page = 0) => api.get<Page<NoticeSummary>>("/notices", { page }),
  notice: (id: number) => api.get<Notice>(`/notices/${id}`),
  settings: () => api.get<StoreSettings>("/store/settings"),
};
