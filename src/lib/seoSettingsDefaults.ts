import type { SiteSeoSettings } from '../types';

export const DEFAULT_SITE_SEO: SiteSeoSettings = {
  siteUrl: 'https://zhinopsy.com',
  defaultTitle: '',
  defaultDescription: '',
  defaultKeywords: '',
  ogImage: '',
  googleSiteVerification: '',
  bingSiteVerification: '',
  googleHtmlVerificationFilename: '',
  googleAnalyticsId: '',
  googleTagManagerId: '',
  robotsTxt: '',
  sitemapXml: '',
};

export function mergeSiteSeo(partial?: Partial<SiteSeoSettings> | null): SiteSeoSettings {
  return {
    ...DEFAULT_SITE_SEO,
    ...(partial || {}),
    siteUrl: (partial?.siteUrl ?? DEFAULT_SITE_SEO.siteUrl).trim().replace(/\/+$/, ''),
    defaultTitle: (partial?.defaultTitle ?? DEFAULT_SITE_SEO.defaultTitle).trim(),
    defaultDescription: (partial?.defaultDescription ?? DEFAULT_SITE_SEO.defaultDescription).trim(),
    defaultKeywords: (partial?.defaultKeywords ?? DEFAULT_SITE_SEO.defaultKeywords).trim(),
    ogImage: (partial?.ogImage ?? DEFAULT_SITE_SEO.ogImage).trim(),
    googleSiteVerification: (partial?.googleSiteVerification ?? DEFAULT_SITE_SEO.googleSiteVerification).trim(),
    bingSiteVerification: (partial?.bingSiteVerification ?? DEFAULT_SITE_SEO.bingSiteVerification).trim(),
    googleHtmlVerificationFilename: (
      partial?.googleHtmlVerificationFilename ?? DEFAULT_SITE_SEO.googleHtmlVerificationFilename
    ).trim(),
    googleAnalyticsId: (partial?.googleAnalyticsId ?? DEFAULT_SITE_SEO.googleAnalyticsId).trim(),
    googleTagManagerId: (partial?.googleTagManagerId ?? DEFAULT_SITE_SEO.googleTagManagerId).trim(),
    robotsTxt: partial?.robotsTxt ?? DEFAULT_SITE_SEO.robotsTxt,
    sitemapXml: partial?.sitemapXml ?? DEFAULT_SITE_SEO.sitemapXml,
  };
}

/** Safe Google Search Console HTML verification filename */
export function isGoogleVerificationFilename(name: string): boolean {
  return /^google[a-z0-9]+\.html$/i.test(name.trim());
}
