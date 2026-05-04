import { useState, useRef } from 'react';
import { usePhotos, useUploadPhoto, useDeletePhoto, useSetCoverPhoto } from '@/hooks/useSubResources';
import type { Photo } from '@/lib/types';

interface PhotoGalleryProps {
  entityType: 'project' | 'craft' | 'technique' | 'material' | 'curiosity' | 'log';
  entityId: number;
}

export function PhotoGallery({ entityType, entityId }: PhotoGalleryProps) {
  const { data, isLoading } = usePhotos({ entity_type: entityType, entity_id: entityId });
  const uploadPhoto = useUploadPhoto();
  const deletePhoto = useDeletePhoto();
  const setCover = useSetCoverPhoto();
  const fileRef = useRef<HTMLInputElement>(null);
  const [caption, setCaption] = useState('');
  const [viewImage, setViewImage] = useState<string | null>(null);

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    if (caption) formData.append('caption', caption);
    formData.append('entity_type', entityType);
    formData.append('entity_id', String(entityId));
    await uploadPhoto.mutateAsync(formData);
    setCaption('');
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div className="p-4 bg-card border border-border rounded-xl">
      <h2 className="text-sm font-medium text-text-secondary mb-3">Photos</h2>

      <div className="flex gap-2 mb-3">
        <input ref={fileRef} type="file" accept="image/*" className="text-xs text-text-secondary file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-accent file:text-white file:cursor-pointer" />
        <input value={caption} onChange={e => setCaption(e.target.value)} placeholder="Caption" className="flex-1 px-2 py-1 bg-page border border-border rounded text-xs text-text-primary focus:border-accent focus:outline-none" />
        <button onClick={handleUpload} disabled={uploadPhoto.isPending} className="px-3 py-1 bg-accent text-white rounded text-xs hover:bg-accent-light disabled:opacity-50">
          {uploadPhoto.isPending ? '...' : 'Upload'}
        </button>
      </div>

      {isLoading && <p className="text-xs text-text-muted">Loading...</p>}
      {data?.items.length === 0 && !isLoading && <p className="text-xs text-text-muted">No photos yet.</p>}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {data?.items.map((photo: Photo) => (
          <div key={photo.id} className="relative group aspect-square">
            <img
              src={`/api/photos/file/${photo.id}/thumb_400.webp`}
              alt={photo.caption || ''}
              onClick={() => setViewImage(`/api/photos/file/${photo.id}/${photo.image}`)}
              className={`w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity ${photo.is_cover ? 'ring-2 ring-accent' : ''}`}
            />
            <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {!photo.is_cover && (
                <button
                  onClick={() => setCover.mutate(photo.id)}
                  title="Set as cover"
                  className="w-5 h-5 bg-black/60 text-white rounded-full text-xs flex items-center justify-center"
                >★</button>
              )}
              <button
                onClick={() => { if (confirm('Delete this photo?')) deletePhoto.mutate(photo.id); }}
                className="w-5 h-5 bg-black/60 text-white rounded-full text-xs flex items-center justify-center"
              >×</button>
            </div>
            {photo.is_cover && <span className="absolute bottom-1 left-1 bg-accent text-white text-[10px] px-1 rounded">Cover</span>}
          </div>
        ))}
      </div>

      {viewImage && (
        <div onClick={() => setViewImage(null)} className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-pointer">
          <img src={viewImage} alt="Full size" className="max-w-full max-h-full object-contain rounded-lg" />
        </div>
      )}
    </div>
  );
}
