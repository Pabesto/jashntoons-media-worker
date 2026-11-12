// Intentionally empty by default.
// Add Drizzle tables here when the site actually needs a database.
// See examples/d1/db/schema.ts for an opt-in example.
import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(), owner: text('owner').notNull(), title: text('title').notNull(),
  payload: text('payload').notNull(), updated: integer('updated').notNull(),
}, t => [index('projects_owner').on(t.owner)]);
export const media = sqliteTable('media', {
  id: text('id').primaryKey(), owner: text('owner').notNull(), mime: text('mime').notNull(),
  size: integer('size').notNull(), created: integer('created').notNull(), digest:text('digest'),
}, t => [index('media_owner').on(t.owner)]);
export const aiUsage = sqliteTable('ai_usage', { key: text('key').primaryKey(), count: integer('count').notNull() });
export const reelJobs = sqliteTable('reel_jobs', {
 id:text('id').primaryKey(),owner:text('owner').notNull(),status:text('status').notNull(),payload:text('payload').notNull(),
 created:integer('created').notNull(),updated:integer('updated').notNull(),mediaId:text('media_id'),providerTask:text('provider_task'),
 mime:text('mime'),size:integer('size'),error:text('error'),creditCost:integer('credit_cost').notNull().default(1),projectId:text('project_id'),generationKey:text('generation_key'),
},t=>[index('reel_jobs_owner').on(t.owner),uniqueIndex('generation_cache').on(t.owner,t.generationKey)]);
export const avatars=sqliteTable('avatars',{
 id:text('id').primaryKey(),owner:text('owner').notNull(),artId:text('art_id').notNull(),videoId:text('video_id'),mode:text('mode').notNull(),templateId:text('template_id').notNull(),created:integer('created').notNull(),
},t=>[index('avatars_owner').on(t.owner)]);
export const creditGrants=sqliteTable('credit_grants',{id:text('id').primaryKey(),owner:text('owner').notNull(),credits:integer('credits').notNull(),created:integer('created').notNull()});
export const carts=sqliteTable('carts',{owner:text('owner').primaryKey(),items:text('items').notNull(),updated:integer('updated').notNull()});
export const authAccounts=sqliteTable('auth_accounts',{providerId:text('provider_id').primaryKey(),owner:text('owner').notNull()});
export const authStates=sqliteTable('auth_states',{id:text('id').primaryKey(),nonce:text('nonce').notNull(),verifier:text('verifier').notNull(),linkOwner:text('link_owner'),expires:integer('expires').notNull()});
export const authSessions=sqliteTable('auth_sessions',{id:text('id').primaryKey(),owner:text('owner').notNull(),email:text('email').notNull(),name:text('name').notNull(),expires:integer('expires').notNull()});
export const creatorBundles=sqliteTable('creator_bundles',{
 id:text('id').primaryKey(),owner:text('owner').notNull(),title:text('title').notNull(),creator:text('creator').notNull(),caption:text('caption').notNull(),items:text('items').notNull(),published:integer('published').notNull().default(1),created:integer('created').notNull(),
},t=>[index('creator_bundles_owner').on(t.owner),index('creator_bundles_public').on(t.published,t.created)]);
export const creatorLikes=sqliteTable('creator_likes',{
 bundleId:text('bundle_id').notNull(),owner:text('owner').notNull(),created:integer('created').notNull(),
},t=>[uniqueIndex('creator_like_once').on(t.bundleId,t.owner)]);

export const reelDelivery=sqliteTable('reel_delivery',{
 id:text('id').primaryKey(),reelId:text('reel_id').notNull(),owner:text('owner').notNull(),status:text('status').notNull(),attempts:integer('attempts').notNull().default(0),lease:text('lease'),leaseUntil:integer('lease_until'),size:integer('size'),error:text('error'),updated:integer('updated').notNull(),
},t=>[uniqueIndex('reel_delivery_once').on(t.reelId),index('reel_delivery_queue').on(t.status,t.updated)]);
