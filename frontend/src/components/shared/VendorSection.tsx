import { useState } from 'react';
import { useVendors, useAddVendor, useDeleteVendor } from '@/hooks/useSubResources';
import type { MaterialVendor } from '@/lib/types';

interface VendorSectionProps {
  materialId: number;
}

export function VendorSection({ materialId }: VendorSectionProps) {
  const { data, isLoading } = useVendors(materialId);
  const addVendor = useAddVendor();
  const deleteVendor = useDeleteVendor();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await addVendor.mutateAsync({
      materialId,
      data: { name, url: url || undefined, notes: notes || undefined },
    });
    setName('');
    setUrl('');
    setNotes('');
    setShowForm(false);
  }

  return (
    <div className="p-4 bg-card border border-border rounded-xl">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-text-secondary">Vendors</h2>
        <button onClick={() => setShowForm(!showForm)} className="text-xs text-accent-light hover:text-accent">{showForm ? 'Cancel' : '+ Vendor'}</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 p-3 bg-page rounded-lg space-y-2">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Vendor name" required className="w-full px-2 py-1.5 bg-card border border-border rounded text-sm text-text-primary focus:border-accent focus:outline-none" />
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="URL (optional)" type="url" className="w-full px-2 py-1.5 bg-card border border-border rounded text-sm text-text-primary focus:border-accent focus:outline-none" />
          <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (optional)" className="w-full px-2 py-1.5 bg-card border border-border rounded text-sm text-text-primary focus:border-accent focus:outline-none" />
          <button type="submit" disabled={addVendor.isPending} className="px-3 py-1.5 bg-accent text-white rounded text-xs hover:bg-accent-light disabled:opacity-50">Add Vendor</button>
        </form>
      )}

      {isLoading && <p className="text-xs text-text-muted">Loading...</p>}
      {data?.items.length === 0 && !isLoading && <p className="text-xs text-text-muted">No vendors yet.</p>}
      <div className="space-y-2">
        {data?.items.map((vendor: MaterialVendor) => (
          <div key={vendor.id} className="flex items-center justify-between p-2 bg-page rounded-lg">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-primary font-medium">
                {vendor.url ? <a href={vendor.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent-light">{vendor.name}</a> : vendor.name}
              </p>
              {vendor.notes && <p className="text-xs text-text-muted mt-0.5">{vendor.notes}</p>}
            </div>
            <button onClick={() => { if (confirm('Remove this vendor?')) deleteVendor.mutate({ materialId, vendorId: vendor.id }); }} className="text-xs text-text-muted hover:text-error ml-2">×</button>
          </div>
        ))}
      </div>
    </div>
  );
}
