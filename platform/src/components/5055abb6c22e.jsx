'use client';
import { useState } from 'react';
import { Input } from '@/components/c2f62fb0cb5e';
import { useDiagnosisSearch } from '@/components/e3bd80106814';
export function DiagnosisSearchDropdown({ onSelect, placeholder = 'Search diagnosis (e.g., F01 or dementia)', minLength = 2, disabled, }) {
    const [query, setQuery] = useState('');
    const { loading, results } = useDiagnosisSearch(query, { minLength });
    return (<div className="space-y-2">
      <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={placeholder} spellCheck={false} disabled={disabled}/>
      {loading ? <div className="text-xs text-muted-foreground">Searching…</div> : null}
      {results.length ? (<div className="max-h-48 overflow-auto rounded-lg border">
          {results.map((d) => (<button key={d.id} type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-muted" onClick={() => {
                    onSelect(d);
                    setQuery('');
                }}>
              <div className="font-medium">
                {d.code} <span className="text-muted-foreground">({d.system})</span>
              </div>
              <div className="text-xs text-muted-foreground">{d.name}</div>
            </button>))}
        </div>) : null}
    </div>);
}
