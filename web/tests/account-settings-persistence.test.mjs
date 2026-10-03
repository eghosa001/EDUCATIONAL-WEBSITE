import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const settings = fs.readFileSync(new URL('../src/app/dashboard/profile/settings/page.tsx', import.meta.url), 'utf8');
const profileStore = fs.readFileSync(new URL('../src/features/profile/store/profileStore.ts', import.meta.url), 'utf8');
const authService = fs.readFileSync(new URL('../src/services/api/authService.ts', import.meta.url), 'utf8');
const prefService = fs.readFileSync(new URL('../src/services/api/notificationPreferenceService.ts', import.meta.url), 'utf8');
const prefMigration = fs.readFileSync(new URL('../../supabase/migrations/20261003154000_add_user_notification_preferences.sql', import.meta.url), 'utf8');
const avatarMigration = fs.readFileSync(new URL('../../supabase/migrations/20261003155500_add_profile_avatar_storage.sql', import.meta.url), 'utf8');

test('profile settings no longer depend on legacy API tokens', () => {
  assert.doesNotMatch(settings, /edu_token/);
  assert.doesNotMatch(settings, /NEXT_PUBLIC_API_URL/);
  assert.doesNotMatch(profileStore, /\/api\/users\/profile/);
  assert.match(profileStore, /from\('profiles'\)/);
});

test('notification preferences persist with user-scoped RLS', () => {
  assert.match(prefService, /user_notification_preferences/);
  assert.match(prefService, /onConflict: 'user_id,channel,notification_type'/);
  assert.match(prefMigration, /enable row level security/i);
  assert.match(prefMigration, /user_id = \(select auth\.uid\(\)\)/i);
});

test('password change verifies the supplied current password', () => {
  assert.match(authService, /current_password/);
  assert.match(authService, /Current password is required/);
  assert.match(settings, /current-password/);
});

test('avatar storage is constrained to the signed-in user folder', () => {
  assert.match(profileStore, /storage\s*\.from\('avatars'\)/);
  assert.match(avatarMigration, /bucket_id = 'avatars'/);
  assert.match(avatarMigration, /storage\.foldername\(name\)/);
  assert.match(avatarMigration, /auth\.jwt\(\)->>'sub'/);
});
