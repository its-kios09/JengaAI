import { useState } from 'react';
import type { FormEvent } from 'react';
import { User, Mail, Lock, Camera, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { AvatarModal } from '@/components/profile/AvatarModal';
import { useAuthStore } from '@/store/auth-store';
import {
  useSession,
  useUpdateProfile,
  useChangePassword,
  useUploadAvatar,
  useDeleteAvatar,
} from '@/hooks/useAuth';

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['bg-danger-500', 'bg-amber-500', 'bg-primary-500', 'bg-success-500'];
  return {
    score,
    label: labels[Math.max(0, score - 1)] || 'Weak',
    color: colors[Math.max(0, score - 1)] || 'bg-danger-500',
  };
}

export function ProfilePage() {
  const { user } = useAuthStore();
  const { data: session } = useSession();
  const updateMutation = useUpdateProfile();
  const changePasswordMutation = useChangePassword();
  const uploadAvatarMutation = useUploadAvatar();
  const deleteAvatarMutation = useDeleteAvatar();

  const currentUser = session || user;

  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const strength = getPasswordStrength(newPassword);

  const handleProfileUpdate = (e: FormEvent) => {
    e.preventDefault();
    setProfileMessage('');
    setProfileError('');

    const updates: { fullName?: string; email?: string } = {};
    if (fullName !== currentUser?.fullName) updates.fullName = fullName;
    if (email !== currentUser?.email) updates.email = email;

    if (Object.keys(updates).length === 0) {
      setProfileError('No changes to save');
      return;
    }

    updateMutation.mutate(updates, {
      onSuccess: (data) => {
        setProfileMessage('Profile updated successfully');
        setFullName(data.fullName);
        setEmail(data.email);
        const store = useAuthStore.getState();
        if (store.user && store.tokens) {
          store.login(
            { ...store.user, fullName: data.fullName, email: data.email },
            store.tokens,
          );
        }
      },
      onError: (err: any) => {
        setProfileError(err?.response?.data?.detail || 'Update failed');
      },
    });
  };

  const handlePasswordChange = (e: FormEvent) => {
    e.preventDefault();
    setPasswordMessage('');
    setPasswordError('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    changePasswordMutation.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          setPasswordMessage('Password changed successfully');
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        },
        onError: (err: any) => {
          const detail = err?.response?.data?.detail;
          if (typeof detail === 'string') {
            setPasswordError(detail);
          } else if (Array.isArray(detail)) {
            setPasswordError(detail.map((d: any) => d.msg).join('. '));
          } else {
            setPasswordError('Failed to change password');
          }
        },
      },
    );
  };

  const handleAvatarUpload = (file: File) => {
    uploadAvatarMutation.mutate(file, {
      onSuccess: (data) => {
        setAvatarModalOpen(false);
        const store = useAuthStore.getState();
        if (store.user && store.tokens) {
          store.login({ ...store.user, avatarUrl: (data as any).avatarUrl }, store.tokens);
        }
      },
    });
  };

  const handleAvatarDelete = () => {
    deleteAvatarMutation.mutate(undefined, {
      onSuccess: () => {
        const store = useAuthStore.getState();
        if (store.user && store.tokens) {
          store.login({ ...store.user, avatarUrl: undefined }, store.tokens);
        }
      },
    });
  };

  const avatarUrl = (session as any)?.avatarUrl || (currentUser as any)?.avatarUrl;
  const initials = currentUser?.fullName
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  const joinDate = currentUser?.createdAt
    ? new Date(currentUser.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Profile</h1>
        <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
          Manage your account settings
        </p>
      </div>

      {/* Avatar & Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <button onClick={() => setAvatarModalOpen(true)} className="group relative">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-20 h-20 rounded-full object-cover" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-primary-500 flex items-center justify-center text-white text-2xl font-bold">
                    {initials}
                  </div>
                )}
                <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-colors">
                  <Camera size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
                {currentUser?.fullName}
              </h2>
              <p className="text-sm text-surface-500 dark:text-surface-400">
                {currentUser?.email}
              </p>
              <p className="text-xs text-surface-400 dark:text-surface-500 mt-1">
                Member since {joinDate}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-4">
            Edit Profile
          </h3>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <Input
              label="Full Name"
              icon={<User size={16} />}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
            />
            <Input
              label="Email"
              type="email"
              icon={<Mail size={16} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            {profileMessage && (
              <div className="flex items-center gap-2 text-sm text-success-600">
                <CheckCircle size={16} /> {profileMessage}
              </div>
            )}
            {profileError && <p className="text-sm text-danger-500">{profileError}</p>}
            <Button type="submit" loading={updateMutation.isPending}>
              Save changes
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-4">
            Change Password
          </h3>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              icon={<Lock size={16} />}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
            />
            <div>
              <Input
                label="New Password"
                type="password"
                icon={<Lock size={16} />}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 characters"
              />
              {newPassword && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= strength.score ? strength.color : 'bg-surface-200 dark:bg-surface-700'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-surface-500 mt-1">{strength.label}</p>
                </div>
              )}
            </div>
            <Input
              label="Confirm New Password"
              type="password"
              icon={<Lock size={16} />}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
            />
            {passwordMessage && (
              <div className="flex items-center gap-2 text-sm text-success-600">
                <CheckCircle size={16} /> {passwordMessage}
              </div>
            )}
            {passwordError && <p className="text-sm text-danger-500">{passwordError}</p>}
            <Button type="submit" loading={changePasswordMutation.isPending}>
              Change password
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Avatar Modal */}
      <AvatarModal
        isOpen={avatarModalOpen}
        onClose={() => setAvatarModalOpen(false)}
        currentAvatarUrl={avatarUrl}
        onUpload={handleAvatarUpload}
        onDelete={handleAvatarDelete}
        isUploading={uploadAvatarMutation.isPending}
      />
    </div>
  );
}
