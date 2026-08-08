import { redirect } from 'next/navigation';

/** /settings has no view of its own; Profile is the first nav item. */
export default function SettingsIndexPage() {
  redirect('/settings/profile');
}
