import { useState } from 'react';
import { useStock, useStockSummary, useAddStock } from '@/hooks/useSubResources';
import { formatDate } from '@/lib/utils';
import type { StockEntry } from '@/lib/types';

interface StockFeedProps {
  materialId: number;
}

export function StockFeed({ materialId }: StockFeedProps) {
  const { data: stockData, isLoading } = useStock(materialId);
  const { data: summary } = useStockSummary(materialId);
  const addStock = useAddStock();
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<'purchase' | 'usage' | 'adjustment'>('purchase');
  const [quantity, setQuantity] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await addStock.mutateAsync({
      materialId,
      data: {
        type,
        quantity: parseFloat(quantity),
        unit_cost: unitCost ? parseFloat(unitCost) : 0,
        notes: notes || undefined,
        date,
      },
    });
    setQuantity('');
    setUnitCost('');
    setNotes('');
    setShowForm(false);
  }

  const typeColors: Record<string, string> = {
    purchase: 'text-green-400',
    usage: 'text-orange-400',
    adjustment: 'text-blue-400',
  };

  return (
    <div className="p-4 bg-card border border-border rounded-xl">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-text-secondary">Stock</h2>
        <button onClick={() => setShowForm(!showForm)} className="text-xs text-accent-light hover:text-accent">{showForm ? 'Cancel' : '+ Entry'}</button>
      </div>

      {summary && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="p-2 bg-page rounded text-center">
            <p className="text-lg font-semibold text-text-primary">{summary.on_hand}</p>
            <p className="text-xs text-text-muted">On Hand</p>
          </div>
          <div className="p-2 bg-page rounded text-center">
            <p className="text-lg font-semibold text-text-primary">${summary.total_spent.toFixed(2)}</p>
            <p className="text-xs text-text-muted">Total Spent</p>
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 p-3 bg-page rounded-lg space-y-2">
          <select value={type} onChange={e => setType(e.target.value as typeof type)} className="w-full px-2 py-1.5 bg-card border border-border rounded text-sm text-text-primary focus:border-accent focus:outline-none">
            <option value="purchase">Purchase</option>
            <option value="usage">Usage</option>
            <option value="adjustment">Adjustment</option>
          </select>
          <div className="flex gap-2">
            <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="Qty" required min="0.01" step="any" className="w-24 px-2 py-1.5 bg-card border border-border rounded text-sm text-text-primary focus:border-accent focus:outline-none" />
            {type === 'purchase' && (
              <input type="number" value={unitCost} onChange={e => setUnitCost(e.target.value)} placeholder="Unit cost" min="0" step="0.01" className="w-24 px-2 py-1.5 bg-card border border-border rounded text-sm text-text-primary focus:border-accent focus:outline-none" />
            )}
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="px-2 py-1.5 bg-card border border-border rounded text-sm text-text-primary focus:border-accent focus:outline-none" />
          </div>
          <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (optional)" className="w-full px-2 py-1.5 bg-card border border-border rounded text-sm text-text-primary focus:border-accent focus:outline-none" />
          <button type="submit" disabled={addStock.isPending} className="px-3 py-1.5 bg-accent text-white rounded text-xs hover:bg-accent-light disabled:opacity-50">Add Entry</button>
        </form>
      )}

      {isLoading && <p className="text-xs text-text-muted">Loading...</p>}
      {stockData?.items.length === 0 && !isLoading && <p className="text-xs text-text-muted">No stock entries.</p>}
      <div className="space-y-1">
        {stockData?.items.map((entry: StockEntry) => (
          <div key={entry.id} className="flex items-center justify-between p-2 bg-page rounded-lg text-sm">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium ${typeColors[entry.type] || ''}`}>{entry.type}</span>
              <span className="text-text-primary">{entry.quantity}{entry.unit_cost > 0 ? ` @ $${entry.unit_cost}` : ''}</span>
            </div>
            <span className="text-xs text-text-muted">{formatDate(entry.date)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
