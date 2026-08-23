import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { managementApi, type ManagedUMKM } from '@loning/shared/lib/management';
import { SHORT_LINK_MESSAGE, normalizeCoordinates, parseLocationInput, buildGoogleMapsEmbedUrl, buildGoogleMapsSearchUrl, buildGoogleMapsDirectionsUrl } from '@loning/shared/lib/location';
import { useManagedItem, useManagedMutation } from '@v2-shared/hooks/useManagement';
import { useUnsavedChanges } from './useUnsavedChanges';
import { ConfirmDialog, ErrorNotice, Field, Input, LoadingPanel, PageHeader, PendingButton } from './Ui';

/**
 * Lokasi Usaha V2 — pasangan fitur dari BusinessLocationPage UI lama.
 * Baca URL Maps -> koordinat, simpan/hapus, pratinjau embed Google Maps.
 */
const parserMessage = (reason: string) =>
  reason === 'short-link'
    ? SHORT_LINK_MESSAGE
    : reason === 'unsupported-host'
      ? 'Host peta tidak didukung.'
      : reason === 'no-coordinates'
        ? 'Koordinat tidak ditemukan pada URL tersebut.'
        : 'URL atau koordinat tidak valid.';

export default function BusinessLocationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const unsaved = useUnsavedChanges();
  const item = useManagedItem('umkms', id, managementApi.umkms.get);
  const [mapsInput, setMapsInput] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [feedback, setFeedback] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmRemove, setConfirmRemove] = useState(false);
  const latitudeRef = useRef<HTMLInputElement>(null);
  const mapsRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!item.data) return;
    setLatitude(item.data.latitude?.toString() ?? '');
    setLongitude(item.data.longitude?.toString() ?? '');
  }, [item.data?.id]);

  const parsed = useMemo(
    () => (latitude.trim() && longitude.trim() ? normalizeCoordinates(Number(latitude), Number(longitude)) : undefined),
    [latitude, longitude],
  );
  const initial = item.data && item.data.latitude !== null && item.data.longitude !== null ? normalizeCoordinates(item.data.latitude, item.data.longitude) : undefined;
  const dirty = Boolean(parsed) ? parsed!.latitude !== initial?.latitude || parsed!.longitude !== initial?.longitude : Boolean(initial);
  useEffect(() => unsaved.setDirty(dirty), [dirty, unsaved]);

  const save = useManagedMutation<{ id: string; coordinates: { latitude: number; longitude: number } }, ManagedUMKM>(
    'manage',
    'umkms',
    ({ id, coordinates }, csrf) => managementApi.umkms.setLocation(id, coordinates, csrf),
    'umkms',
  );
  const remove = useManagedMutation<string, ManagedUMKM>('manage', 'umkms', (targetId, csrf) => managementApi.umkms.clearLocation(targetId, csrf), 'umkms');

  const parseMaps = () => {
    const result = parseLocationInput(mapsInput);
    if (result.ok === false) {
      setFeedback(parserMessage(result.reason));
      mapsRef.current?.focus();
      return;
    }
    setLatitude(String(result.coordinates.latitude));
    setLongitude(String(result.coordinates.longitude));
    setFeedback('Koordinat ditemukan. Tinjau pratinjau lalu simpan.');
    setSuccess('');
  };

  const submit = () => {
    if (!id || !parsed) {
      setFeedback('Latitude dan longitude wajib valid dan berada dalam rentang yang benar.');
      latitudeRef.current?.focus();
      return;
    }
    save.mutate(
      { id, coordinates: parsed },
      {
        onSuccess: (data) => {
          unsaved.markClean();
          setLatitude(String(data.latitude));
          setLongitude(String(data.longitude));
          setSuccess('Lokasi usaha berhasil disimpan.');
          setFeedback('');
          mapsRef.current?.focus();
        },
      },
    );
  };

  if (item.isPending) return <LoadingPanel />;
  if (item.isError || !item.data) return <ErrorNotice error={item.error ?? new Error('UMKM tidak ditemukan.')} />;

  return (
    <>
      <PageHeader
        title="Lokasi Usaha"
        description="Simpan koordinat usaha. URL Maps hanya dipakai sementara untuk membantu membaca koordinat."
      />
      <form
        className="grid gap-6 lg:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <div className="space-y-5">
          <div>
            <p className="text-sm font-medium text-ink">{item.data.name}</p>
            <p className="mt-1 text-sm text-ink-muted">Alamat: {item.data.address}</p>
          </div>
          <Field label="URL Maps" hint="Google Maps atau OpenStreetMap HTTPS lengkap; link pendek tidak didukung.">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                ref={mapsRef}
                type="url"
                value={mapsInput}
                onChange={(event) => setMapsInput(event.target.value)}
                placeholder="https://www.google.com/maps/@..."
                maxLength={2048}
              />
              <button
                type="button"
                onClick={parseMaps}
                className="focus-ring-v2 inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-brand px-4 text-sm font-medium text-on-brand hover:bg-brand-hover"
              >
                Baca URL
              </button>
            </div>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Latitude">
              <Input
                ref={latitudeRef}
                inputMode="decimal"
                value={latitude}
                onChange={(event) => {
                  setLatitude(event.target.value);
                  setSuccess('');
                }}
                aria-invalid={Boolean(latitude && (!parsed || Number(latitude) < -90 || Number(latitude) > 90))}
              />
            </Field>
            <Field label="Longitude">
              <Input
                inputMode="decimal"
                value={longitude}
                onChange={(event) => {
                  setLongitude(event.target.value);
                  setSuccess('');
                }}
                aria-invalid={Boolean(longitude && (!parsed || Number(longitude) < -180 || Number(longitude) > 180))}
              />
            </Field>
          </div>
          {feedback && <p role="alert" className="text-sm text-danger-ink">{feedback}</p>}
          {success && <p role="status" className="text-sm font-medium text-success-ink">{success}</p>}
          {save.isError && <ErrorNotice error={save.error} />}
          {remove.isError && <ErrorNotice error={remove.error} />}
          <div className="flex flex-wrap gap-3">
            <PendingButton type="submit" pending={save.isPending} disabled={!dirty || !parsed}>
              Simpan Lokasi
            </PendingButton>
            {initial && (
              <button
                type="button"
                className="focus-ring-v2 inline-flex min-h-11 items-center justify-center gap-2 rounded-control border border-danger/40 px-4 text-sm font-medium text-danger-ink hover:bg-sunken"
                onClick={() => setConfirmRemove(true)}
              >
                Hapus Lokasi
              </button>
            )}
            <button type="button" className="focus-ring-v2 text-sm font-medium text-ink-muted hover:text-ink" onClick={() => navigate('/v2/dashboard/umkms')}>
              Kembali
            </button>
          </div>
        </div>

        <div className="border-t border-line pt-6 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <h2 className="mb-4 font-display text-lg font-semibold text-ink">Pratinjau</h2>
          {parsed ? (
            <>
              <div className="overflow-hidden border border-line">
                <iframe
                  src={buildGoogleMapsEmbedUrl(parsed)}
                  loading="lazy"
                  title={`Peta lokasi ${item.data.name}`}
                  referrerPolicy="no-referrer-when-downgrade"
                  className="h-64 w-full border-0 sm:h-80"
                />
              </div>
              <p className="mt-2 text-xs text-ink-subtle">Data Peta © Google Maps</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href={buildGoogleMapsSearchUrl(parsed)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="focus-ring-v2 inline-flex min-h-11 items-center gap-2 rounded-control border border-control-border px-4 text-sm font-medium text-ink hover:bg-sunken"
                >
                  Buka di Google Maps
                </a>
                <a
                  href={buildGoogleMapsDirectionsUrl(parsed)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="focus-ring-v2 inline-flex min-h-11 items-center gap-2 rounded-control border border-control-border px-4 text-sm font-medium text-ink hover:bg-sunken"
                >
                  Petunjuk Arah
                </a>
              </div>
            </>
          ) : (
            <p className="text-sm text-ink-muted">Masukkan kedua koordinat valid untuk melihat peta.</p>
          )}
        </div>
      </form>
      {unsaved.dialog}
      <ConfirmDialog
        open={confirmRemove}
        title="Hapus lokasi usaha?"
        description="Koordinat akan dihapus. Alamat teks UMKM tidak berubah."
        confirmLabel="Hapus Lokasi"
        pending={remove.isPending}
        onCancel={() => setConfirmRemove(false)}
        onConfirm={() =>
          id &&
          remove.mutate(id, {
            onSuccess: () => {
              setConfirmRemove(false);
              setLatitude('');
              setLongitude('');
              setMapsInput('');
              setSuccess('Lokasi usaha berhasil dihapus.');
              mapsRef.current?.focus();
            },
          })
        }
      />
    </>
  );
}
