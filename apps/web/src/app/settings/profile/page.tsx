'use client';

import { Pencil } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { initials } from '@/lib/format';
import { useAuth } from '@/providers/auth-provider';

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { user, refresh, logout } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [title, setTitle] = useState('');
  const [username, setUsername] = useState('');
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [status, setStatus] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name ?? '');
    setEmail(user.email ?? '');
    setTitle(user.title ?? '');
    setUsername(user.username ?? '');
  }, [user]);

  const save = async (): Promise<void> => {
    setIsSaving(true);
    setStatus(null);
    try {
      await api.updateProfile({
        name: name.trim() || undefined,
        // Only send email when it actually changed — the API 409s on duplicates.
        ...(email.trim() && email.trim() !== (user?.email ?? '') ? { email: email.trim() } : {}),
        title: title.trim(),
        username: username.trim() || undefined,
      });
      await refresh();
      setStatus({ type: 'success', text: 'Profile updated.' });
      setIsEditingEmail(false);
    } catch (saveError) {
      setStatus({
        type: 'error',
        text: saveError instanceof Error ? saveError.message : 'Could not save profile',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const leaveWorkspace = async (): Promise<void> => {
    const confirmed = window.confirm(
      'This permanently deletes your workspace and every task in it. Continue?',
    );
    if (!confirmed) return;

    await api.deleteAccount();
    logout();
    router.replace('/login');
  };

  if (!user) return null;

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight sm:text-3xl">Profile</h1>

      <div className="rounded-xl border border-border">
        <Row label="Profile picture">
          <Avatar className="size-10">
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
            <AvatarFallback className="text-xs">{initials(user.name)}</AvatarFallback>
          </Avatar>
        </Row>

        <Row label="Email">
          {isEditingEmail ? (
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="w-56"
              autoFocus
            />
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {user.email ?? 'No email set'}
              </span>
              <button
                type="button"
                onClick={() => setIsEditingEmail(true)}
                aria-label="Edit email"
                className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Pencil className="size-3.5" />
              </button>
            </div>
          )}
        </Row>

        <Row label="Full name">
          <Input
            variant="filled"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Dexter"
            className="w-56"
            maxLength={80}
          />
        </Row>

        <Row label="Title" sublabel="Your job title or role">
          <Input
            variant="filled"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Designer"
            className="w-56"
            maxLength={80}
          />
        </Row>

        <Row label="Username" sublabel="One word, like a nickname or first name" last>
          <Input
            variant="filled"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Dexuser"
            className="w-56"
            maxLength={40}
          />
        </Row>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Button onClick={save} disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save changes'}
        </Button>
        {status && (
          <p
            role={status.type === 'error' ? 'alert' : 'status'}
            className={status.type === 'error' ? 'text-sm text-destructive' : 'text-sm text-muted-foreground'}
          >
            {status.text}
          </p>
        )}
      </div>

      <h2 className="mb-4 mt-10 text-lg font-semibold tracking-tight">Workspace access</h2>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border px-5 py-4">
        <p className="text-sm text-muted-foreground">Remove yourself from the workspace</p>
        <Button variant="destructive" size="sm" onClick={leaveWorkspace}>
          Leave Workspace
        </Button>
      </div>
    </>
  );
}

function Row({
  label,
  sublabel,
  children,
  last = false,
}: {
  label: string;
  sublabel?: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 px-5 py-4 ${
        last ? '' : 'border-b border-border'
      }`}
    >
      <div>
        <p className="text-sm font-medium">{label}</p>
        {sublabel && <p className="text-sm text-muted-foreground">{sublabel}</p>}
      </div>
      {children}
    </div>
  );
}
