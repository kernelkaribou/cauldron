import { useState, useRef } from 'react';
import { usePhotos, useUploadPhoto, useDeletePhoto } from '@/hooks/useSubResources';

interface PhotoGalleryProps {
  recipeId?: number;
  brewId?: number;
}

export function PhotoGallery({ recipeId, brewId }: PhotoGalleryProps) {
  const { data, isLoading } = usePhotos({ recipe_id: recipeId, brew_id: brewId });
  const uploadPhoto = useUploadPhoto();
  const deletePhoto = useDeletePhoto();
  const fileRef = useRef<HTMLInputElement>(null);
  const [caption, setCaption] = useState('');
  const [viewImage, setViewImage] = useState<string | null>(null);

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    if (caption) formData.append('caption', caption);
    if (recipeId) formData.append('recipe_id', String(recipeId));
    if (brewId) formData.append('brew_id', String(brewId));
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
        {data?.items.map(photo => (
          <div key={photo.id} className="relative group aspect-square">
            <img
              src={`/api/uploads/${photo.image}`}
              alt={photo.caption || ''}
              onClick={() => setViewImage(`/api/uploads/${photo.image}`)}
              className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
            />
            <button
              onClick={() => deletePhoto.mutate(photo.id)}
              className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >×</button>
          </div>
        ))}
      </div>

      {viewImage && (
        <div onClick={() => setViewImage(null)} className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-pointer">
          <img src={viewImage} className="max-w-full max-h-full object-contain rounded-lg" />
        </div>
      )}
    </div>
  );
}
