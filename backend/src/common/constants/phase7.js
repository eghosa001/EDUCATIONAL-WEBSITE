export const MARKETPLACE_CATEGORIES = {
  EBOOK: 'ebook',
  VIDEO_COURSE: 'video_course',
  AUDIO: 'audio',
  TEMPLATE: 'template',
  TOOL: 'tool',
  NOTEPAD: 'notepad',
  WORKSHEET: 'worksheet',
  ASSESSMENT: 'assessment',
  OTHER: 'other',
};

export const MARKETPLACE_PRODUCT_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  ARCHIVED: 'archived',
  DELISTED: 'delisted',
};

export const ORDER_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  COMPLETED: 'completed',
  REFUNDED: 'refunded',
  CANCELLED: 'cancelled',
  FAILED: 'failed',
};

export const CORPORATE_TRAINING_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  ARCHIVED: 'archived',
  COMPLETED: 'completed',
};

export const AFFILIATE_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  APPROVED: 'approved',
};

export const AFFILIATE_PAYOUT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  PAID: 'paid',
  REJECTED: 'rejected',
};

export const AD_CAMPAIGN_TYPES = {
  BANNER: 'banner',
  NATIVE: 'native',
  SPONSORED_CONTENT: 'sponsored_content',
  VIDEO: 'video',
  POPUP: 'popup',
};

export const AD_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
};

export const AD_PLACEMENT_SLOT_TYPES = {
  BANNER_TOP: 'banner_top',
  BANNER_BOTTOM: 'banner_bottom',
  SIDEBAR: 'sidebar',
  IN_CONTENT: 'in_content',
  INTERSTITIAL: 'interstitial',
  NATIVE: 'native',
  HEADER: 'header',
};

export const ERROR_CODES_PHASE7 = {
  AFFILIATE_NOT_FOUND: 'AFFILIATE_NOT_FOUND',
  AFFILIATE_ALREADY_EXISTS: 'AFFILIATE_ALREADY_EXISTS',
  CAMPAIGN_NOT_FOUND: 'CAMPAIGN_NOT_FOUND',
  PLACEMENT_NOT_FOUND: 'PLACEMENT_NOT_FOUND',
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  CART_ITEM_NOT_FOUND: 'CART_ITEM_NOT_FOUND',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  ORGANIZATION_NOT_FOUND: 'ORGANIZATION_NOT_FOUND',
  TRAINING_FULL: 'TRAINING_FULL',
};
