import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { authApi, rememberSession } from '../lib/auth';
import { useCsrfToken } from '../hooks/useAuth';
import { ErrorNotice, Field, Input, PageHeader, PendingButton } from '../components/dashboard/Ui';

export default function ChangePasswordPage() {
  const [currentPassword, setCurrent] = useState(''); const [newPassword, setNext] = useState(''); const [confirm, setConfirm] = useState(''); const client = useQueryClient(); const csrf = useCsrfToken(); const navigate = useNavigate(); const [localError, setLocalError] = useState('');
  const mutation = useMutation({ mutationFn: () => authApi.changePassword({ currentPassword, newPassword }, csrf), onSuccess: () => { rememberSession(client, null); navigate('/login', { replace: true }); } });
  const submit = (event: FormEvent) => { event.preventDefault(); if (newPassword.length < 12) return setLocalError('Kata sandi baru minimal 12 karakter.'); if (newPassword !== confirm) return setLocalError('Konfirmasi kata sandi tidak sama.'); setLocalError(''); mutation.mutate(); };
  return <main className="min-h-screen bg-cream-bg px-4 py-12"><div className="mx-auto max-w-xl rounded-3xl border border-sage-border bg-white p-6 shadow-sm sm:p-9"><PageHeader title="Ganti kata sandi" description="Buat kata sandi baru sebelum melanjutkan ke dashboard."/><form className="space-y-5" onSubmit={submit}>{mutation.isError && <ErrorNotice error={mutation.error}/>}<Field label="Kata sandi saat ini"><Input type="password" autoComplete="current-password" required value={currentPassword} onChange={(e) => setCurrent(e.target.value)}/></Field><Field label="Kata sandi baru" hint="Gunakan minimal 12 karakter."><Input type="password" autoComplete="new-password" required value={newPassword} onChange={(e) => setNext(e.target.value)}/></Field><Field label="Ulangi kata sandi baru" error={localError}><Input type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} aria-invalid={Boolean(localError)}/></Field><PendingButton type="submit" pending={mutation.isPending}>{mutation.isPending ? 'Menyimpan...' : 'Simpan kata sandi'}</PendingButton></form></div></main>;
}
