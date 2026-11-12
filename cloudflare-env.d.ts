declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    OPENAI_API_KEY?: string;
    OPENAI_MODEL?: string;
    RUNWAY_API_KEY?: string;
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    RUNWAYML_API_SECRET?: string;
    GEMINI_API_KEY?: string;
    GOOGLE_API_KEY?: string;
    CUSTOM_DESIGN_PAYMENT_URL?: string;
    CUSTOM_DESIGN_CONTACT_NUMBER?: string;
    CREDIT_GRANT_ONCE?: string;
  }
}
