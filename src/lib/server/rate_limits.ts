import { RateLimit } from './rate_limit';

export const GLOBAL_EMAIL_RATE_LIMIT = new RateLimit('global-email', 100, 60 * 60);
