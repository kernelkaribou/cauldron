import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TechniquePicker } from '@/components/shared/TechniquePicker';
import { MaterialPicker } from '@/components/shared/MaterialPicker';
import { CategorySelect } from '@/components/shared/CategorySelect';
import { useCraft, useUpdateCraft } from '@/hooks/useCrafts';
import { ApiError } from '@/lib/api';
import {
  areMaterialSelectionsEqual,
  areTechniqueSelectionsEqual,
  buildMaterialPayload,
  buildTechniquePayload,
  mapCraftMaterialToSelection,
  mapCraftTechniqueToSelection,
  type MaterialSelection,
  type TechniqueSelection,
} from '@/pages/crafts/craftFormUtils';

export function CraftEdit() {
  const { id } = useParams();
  const craftId = Number(id);
  const { data: craft, isLoading } = useCraft(craftId, ['category', 'tags', 'techniques', 'materials']);
  const updateCraft = useUpdateCraft();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [duration, setDuration] = useState('');
  const [techniques, setTechniques] = useState<TechniqueSelection[]>([]);
  const [materials, setMaterials] = useState<MaterialSelection[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [initialized, setInitialized] = useState(false);

  const initialTechniques = useMemo(
    () => (craft?.techniques || []).map(mapCraftTechniqueToSelection),
    [craft?.techniques],
  );
  const initialMaterials = useMemo(
    () => (craft?.materials || []).map(mapCraftMaterialToSelection),
    [craft?.materials],
  );

  useEffect(() => {
    if (!craft || initialized) return;

    setTitle(craft.title);
    setDescription(craft.description || '');
    setCategoryId(craft.category_id);
    setDuration(craft.duration_minutes ? String(craft.duration_minutes) : '');
    setTechniques(initialTechniques);
    setMaterials(initialMaterials);
    setInitialized(true);
  }, [craft, initialMaterials, initialTechniques, initialized]);

  if (isLoading) return <p className="text-text-muted">Loading...</p>;
  if (!craft) return <p className="text-text-muted">Craft not found.</p>;
  if (!initialized) return <p className="text-text-muted">Loading...</p>;

  const currentCraft = craft;
  const techniquesChanged = areTechniqueSelectionsEqual(techniques, initialTechniques) === false;
  const materialsChanged = areMaterialSelectionsEqual(materials, initialMaterials) === false;
  const isSubmitDisabled = !title.trim() || techniques.length < 1 || materials.length < 1 || updateCraft.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const data: Parameters<typeof updateCraft.mutateAsync>[0]['data'] = {};

    if (title.trim() !== currentCraft.title) data.title = title.trim();
    if (description !== (currentCraft.description || '')) data.description = description.trim() || undefined;
    if ((categoryId ?? null) !== (currentCraft.category_id ?? null)) data.category_id = categoryId;
    if (duration !== (currentCraft.duration_minutes ? String(currentCraft.duration_minutes) : '')) {
      data.duration_minutes = duration ? parseInt(duration, 10) : 0;
    }
    if (techniquesChanged) data.techniques = buildTechniquePayload(techniques);
    if (materialsChanged) data.materials = buildMaterialPayload(materials);

    if (Object.keys(data).length === 0) {
      navigate(`/crafts/${craftId}`);
      return;
    }

    try {
      await updateCraft.mutateAsync({ id: craftId, data });
      navigate(`/crafts/${craftId}`);
    } catch (err) {
      if (err instanceof ApiError && err.details) {
        setErrors(err.details);
        return;
      }

      setErrors({ form: 'Unable to update craft right now.' });
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-xl font-semibold text-text-primary">Edit Craft</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="rounded-xl border border-border bg-card p-4 space-y-4">
          <div>
            <label className="mb-1 block text-sm text-text-secondary">Title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-page px-3 py-2 text-text-primary focus:border-accent focus:outline-none"
            />
            {errors.title && <p className="mt-1 text-xs text-error">{errors.title}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm text-text-secondary">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              className="w-full resize-y rounded-lg border border-border bg-page px-3 py-2 text-text-primary focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-text-secondary">Category</label>
            <CategorySelect categoryId={categoryId} onCategoryChange={setCategoryId} />
          </div>

          <div>
            <label className="mb-1 block text-sm text-text-secondary">Estimated Duration (minutes)</label>
            <input
              type="number"
              value={duration}
              onChange={e => setDuration(e.target.value)}
              min="0"
              className="w-full rounded-lg border border-border bg-page px-3 py-2 text-text-primary focus:border-accent focus:outline-none"
            />
          </div>
        </div>

        <TechniquePicker
          selected={techniques}
          onAdd={item => setTechniques(current => [...current, { ...item }])}
          onCreate={item => setTechniques(current => [...current, { mode: 'existing', id: item.id, title: item.title }])}
          onRemove={id => setTechniques(current => current.filter(item => item.id !== id))}
        />

        <MaterialPicker
          selected={materials}
          onAdd={item => setMaterials(current => [...current, { ...item, quantity: undefined }])}
          onCreate={item => setMaterials(current => [...current, { mode: 'existing', id: item.id, name: item.name, unit: item.unit }])}
          onRemove={id => setMaterials(current => current.filter(item => item.id !== id))}
          onUpdate={(id, changes) => setMaterials(current => current.map(item => (item.id === id ? { ...item, ...changes } : item)))}
        />

        {errors.form && <p className="text-sm text-error">{errors.form}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="rounded-lg bg-accent px-4 py-2 font-medium text-white transition-colors hover:bg-accent-light disabled:opacity-50"
          >
            {updateCraft.isPending ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/crafts/${craftId}`)}
            className="rounded-lg border border-border px-4 py-2 text-text-secondary transition-colors hover:border-accent"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
