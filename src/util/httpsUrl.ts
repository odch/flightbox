// For links the pages without a login show visitors, e.g. the privacy
// policy the admins set: https only
export const httpsUrl = (url: string | null | undefined): string | null =>
  url && /^https:\/\//i.test(url) ? url : null;
