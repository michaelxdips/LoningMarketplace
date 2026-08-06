import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import BusinessLocation from '../components/shared/BusinessLocation';
import { ConfirmDialog, ErrorNotice, Field, Input, LoadingPanel, PageHeader, PendingButton, buttonClass, dangerButtonClass } from '../components/dashboard/Ui';
import { useManagedItem, useManagedMutation } from '../hooks/useManagement';
import { managementApi, type ManagedUMKM } from '../lib/management';
import { SHORT_LINK_MESSAGE, normalizeCoordinates, parseLocationInput } from '../lib/location';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';

const parserMessage = (reason: string) => reason === 'short-link' ? SHORT_LINK_MESSAGE : reason === 'unsupported-host' ? 'Host peta tidak didukung.' : reason === 'no-coordinates' ? 'Koordinat tidak ditemukan pada URL tersebut.' : 'URL atau koordinat tidak valid.';

export default function BusinessLocationPage() {
  const { id } = useParams(); const navigate = useNavigate();
  const unsaved = useUnsavedChanges();
  const item = useManagedItem('umkms', id, managementApi.umkms.get);
  const [mapsInput, setMapsInput] = useState(''); const [latitude, setLatitude] = useState(''); const [longitude, setLongitude] = useState('');
  const [feedback, setFeedback] = useState(''); const [success, setSuccess] = useState(''); const [confirmRemove, setConfirmRemove] = useState(false);
  const latitudeRef = useRef<HTMLInputElement>(null); const mapsRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (!item.data) return; setLatitude(item.data.latitude?.toString() ?? ''); setLongitude(item.data.longitude?.toString() ?? ''); }, [item.data?.id]);
  const parsed = useMemo(() => latitude.trim() && longitude.trim() ? normalizeCoordinates(Number(latitude), Number(longitude)) : undefined, [latitude, longitude]);
  const initial = item.data && item.data.latitude !== null && item.data.longitude !== null ? normalizeCoordinates(item.data.latitude, item.data.longitude) : undefined;
  const dirty = Boolean(parsed) ? parsed!.latitude !== initial?.latitude || parsed!.longitude !== initial?.longitude : Boolean(initial);
  useEffect(() => unsaved.setDirty(dirty), [dirty]);
  const save = useManagedMutation<{ id: string; coordinates: { latitude: number; longitude: number } }, ManagedUMKM>('manage', 'umkms', ({ id, coordinates }, csrf) => managementApi.umkms.setLocation(id, coordinates, csrf), 'umkms');
  const remove = useManagedMutation<string, ManagedUMKM>('manage', 'umkms', (targetId, csrf) => managementApi.umkms.clearLocation(targetId, csrf), 'umkms');
  const parseMaps = () => { const result = parseLocationInput(mapsInput); if (result.ok === false) { setFeedback(parserMessage(result.reason)); mapsRef.current?.focus(); return; } setLatitude(String(result.coordinates.latitude)); setLongitude(String(result.coordinates.longitude)); setFeedback('Koordinat ditemukan. Tinjau pratinjau lalu simpan.'); setSuccess(''); };
  const submit = () => { if (!id || !parsed) { setFeedback('Latitude dan longitude wajib valid dan berada dalam rentang yang benar.'); latitudeRef.current?.focus(); return; } save.mutate({ id, coordinates: parsed }, { onSuccess: data => { unsaved.markClean(); setLatitude(String(data.latitude)); setLongitude(String(data.longitude)); setSuccess('Lokasi usaha berhasil disimpan.'); setFeedback(''); mapsRef.current?.focus(); } }); };
  if (item.isPending) return <LoadingPanel />;
  if (item.isError || !item.data) return <ErrorNotice error={item.error ?? new Error('UMKM tidak ditemukan.')} />;
  return <>
    <PageHeader title="Lokasi Usaha" description="Simpan koordinat usaha. URL Maps hanya dipakai sementara untuk membantu membaca koordinat." />
    <form className="grid gap-6 lg:grid-cols-2" onSubmit={event => { event.preventDefault(); submit(); }}>
      <div className="space-y-5 rounded-2xl border border-sage-border bg-white p-5 sm:p-7">
        <div><p className="text-sm font-bold text-charcoal">{item.data.name}</p><p className="mt-1 text-sm text-warm-gray">Alamat: {item.data.address}</p></div>
        <Field label="URL Maps" hint="Google Maps atau OpenStreetMap HTTPS lengkap; link pendek tidak didukung."><div className="flex flex-col gap-2 sm:flex-row"><Input ref={mapsRef} type="url" value={mapsInput} onChange={event => setMapsInput(event.target.value)} placeholder="https://www.google.com/maps/@..." maxLength={2048}/><button type="button" className={buttonClass} onClick={parseMaps}>Baca URL</button></div></Field>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Latitude"><Input ref={latitudeRef} inputMode="decimal" value={latitude} onChange={event => { setLatitude(event.target.value); setSuccess(''); }} aria-invalid={Boolean(latitude && (!parsed || Number(latitude) < -90 || Number(latitude) > 90))}/></Field><Field label="Longitude"><Input inputMode="decimal" value={longitude} onChange={event => { setLongitude(event.target.value); setSuccess(''); }} aria-invalid={Boolean(longitude && (!parsed || Number(longitude) < -180 || Number(longitude) > 180))}/></Field></div>
        {feedback && <p role="alert" className="text-sm text-red-700">{feedback}</p>}{success && <p role="status" className="text-sm font-semibold text-forest">{success}</p>}{save.isError && <ErrorNotice error={save.error}/>} {remove.isError && <ErrorNotice error={remove.error}/>}
        <div className="flex flex-wrap gap-3"><PendingButton type="submit" pending={save.isPending} disabled={!dirty || !parsed}>Simpan Lokasi</PendingButton>{initial && <button type="button" className={dangerButtonClass} onClick={() => setConfirmRemove(true)}>Hapus Lokasi</button>}<button type="button" className="text-sm font-bold text-warm-gray" onClick={() => navigate('/dashboard/umkms')}>Kembali</button></div>
      </div>
      <div className="rounded-2xl border border-sage-border bg-white p-5 sm:p-7"><h2 className="mb-4 text-lg font-extrabold">Pratinjau</h2>{parsed ? <BusinessLocation umkmName={item.data.name} address={item.data.address} latitude={parsed.latitude} longitude={parsed.longitude}/> : <p className="text-sm text-warm-gray">Masukkan kedua koordinat valid untuk melihat peta.</p>}</div>
    </form>
    {unsaved.dialog}
    <ConfirmDialog open={confirmRemove} title="Hapus lokasi usaha?" description="Koordinat akan dihapus. Alamat teks UMKM tidak berubah." confirmLabel="Hapus Lokasi" pending={remove.isPending} onCancel={() => setConfirmRemove(false)} onConfirm={() => id && remove.mutate(id, { onSuccess: () => { setConfirmRemove(false); setLatitude(''); setLongitude(''); setMapsInput(''); setSuccess('Lokasi usaha berhasil dihapus.'); mapsRef.current?.focus(); } })}/>
  </>;
}
