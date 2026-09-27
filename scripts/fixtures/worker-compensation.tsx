import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { LanguageProvider } from '../../src/contexts/LanguageContext';
import { WorkerCompensationFields } from '../../src/components/WorkerCompensationFields';
import { CompletedQuantityField } from '../../src/components/CompletedQuantityField';
import type { WorkerCompensation } from '../../src/types';
import '../../src/index.css';
function Fixture() {
  const [terms,setTerms] = useState<WorkerCompensation>({method:'HOURLY'});
  const [quantity,setQuantity] = useState<number>();
  return <main className="max-w-3xl mx-auto p-4"><form onSubmit={e => { e.preventDefault(); (window as any).saved = {terms,quantity}; }}>
    <WorkerCompensationFields value={terms} onChange={setTerms} />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
      <CompletedQuantityField className="md:col-span-2" project={{workerCompensations:{worker:terms}} as any} workerId="worker" value={quantity} onChange={setQuantity} />
    </div>
    <button type="submit">Save</button>
  </form></main>;
}
createRoot(document.getElementById('root')!).render(<LanguageProvider><Fixture /></LanguageProvider>);
