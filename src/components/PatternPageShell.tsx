import { useState, useMemo } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, Clock, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { PatternGroup, DetectedPattern } from '@/hooks/usePatternScanner';
import { TIMEFRAME_LABELS, type Timeframe } from '@/types/scanner';

type TypeFilter = 'all' | 'bullish' | 'bearish' | 'neutral';
type SigFilter = 'all' | 'high' | 'medium' | 'low';

const SCAN_TIMEFRAMES: Timeframe[] = ['5', '15', '60', '240', 'D', 'W'];

interface PatternPageShellProps {
  title: string;
  subtitle: string;
  groups: PatternGroup[];
  scanning: boolean;
  lastScanTime: number;
  scanProgress: { current: number; total: number };
  onRescan: () => void;
}

export function PatternPageShell({
  title, subtitle, groups, scanning, lastScanTime, scanProgress, onRescan,
}: PatternPageShellProps) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [sigFilter, setSigFilter] = useState<SigFilter>('all');
  const [nameFilter, setNameFilter] = useState<string | null>(null);
  const [tfFilter, setTfFilter] = useState<Timeframe | 'all'>('all');

  const lastScanStr = lastScanTime
    ? new Date(lastScanTime).toLocaleTimeString('en-US', { hour12: false })
    : '—';

  // Collect all unique pattern names for the name filter chips
  const allPatternNames = useMemo(() => {
    const names = new Set<string>();
    for (const g of groups) {
      for (const p of g.patterns) {
        names.add(p.pattern.name);
      }
    }
    return Array.from(names).sort();
  }, [groups]);

  // Apply filters
  const filteredGroups = useMemo(() => {
    const result: PatternGroup[] = [];
    const timeframes = tfFilter === 'all' ? SCAN_TIMEFRAMES : [tfFilter];

    for (const tf of timeframes) {
      const group = groups.find(g => g.timeframe === tf);
      if (!group) continue;

      const filtered = group.patterns.filter(dp => {
        if (typeFilter !== 'all' && dp.pattern.type !== typeFilter) return false;
        if (sigFilter !== 'all' && dp.pattern.significance !== sigFilter) return false;
        if (nameFilter && dp.pattern.name !== nameFilter) return false;
        return true;
      });

      if (filtered.length > 0) {
        result.push({ ...group, patterns: filtered });
      }
    }
    return result;
  }, [groups, typeFilter, sigFilter, nameFilter, tfFilter]);

  const totalPatterns = filteredGroups.reduce((s, g) => s + g.patterns.length, 0);
  const hasFilters = typeFilter !== 'all' || sigFilter !== 'all' || nameFilter !== null || tfFilter !== 'all';

  const clearFilters = () => {
    setTypeFilter('all');
    setSigFilter('all');
    setNameFilter(null);
    setTfFilter('all');
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-4 py-2">
        <div>
          <h1 className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{title}</h1>
          <p className="text-[10px] text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] tabular-nums text-muted-foreground">
            {totalPatterns} found • Last: {lastScanStr}
          </span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRescan} disabled={scanning}>
            <RefreshCw className={`h-3.5 w-3.5 ${scanning ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </header>

      {/* Filter bar */}
      <div className="border-b border-border px-4 py-2 space-y-2">
        {/* Row 1: Type + Significance + Timeframe */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Type filter */}
          <div className="flex items-center gap-1">
            <span className="text-[9px] uppercase text-muted-foreground mr-0.5">Type:</span>
            {(['all', 'bullish', 'bearish', 'neutral'] as TypeFilter[]).map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`rounded px-1.5 py-0.5 text-[9px] font-medium transition-colors ${
                  typeFilter === t
                    ? t === 'bullish' ? 'bg-primary/20 text-primary'
                    : t === 'bearish' ? 'bg-destructive/20 text-destructive'
                    : 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t === 'all' ? 'ALL' : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* Significance filter */}
          <div className="flex items-center gap-1">
            <span className="text-[9px] uppercase text-muted-foreground mr-0.5">Sig:</span>
            {(['all', 'high', 'medium', 'low'] as SigFilter[]).map(s => (
              <button
                key={s}
                onClick={() => setSigFilter(s)}
                className={`rounded px-1.5 py-0.5 text-[9px] font-medium transition-colors ${
                  sigFilter === s ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {s === 'all' ? 'ALL' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          {/* Timeframe filter */}
          <div className="flex items-center gap-1">
            <span className="text-[9px] uppercase text-muted-foreground mr-0.5">TF:</span>
            <button
              onClick={() => setTfFilter('all')}
              className={`rounded px-1.5 py-0.5 text-[9px] font-medium transition-colors ${
                tfFilter === 'all' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              ALL
            </button>
            {SCAN_TIMEFRAMES.map(tf => (
              <button
                key={tf}
                onClick={() => setTfFilter(tf)}
                className={`rounded px-1.5 py-0.5 text-[9px] font-medium transition-colors ${
                  tfFilter === tf ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {TIMEFRAME_LABELS[tf]}
              </button>
            ))}
          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-2.5 w-2.5" />
              Clear
            </button>
          )}
        </div>

        {/* Row 2: Pattern name chips */}
        {allPatternNames.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            <Filter className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <button
              onClick={() => setNameFilter(null)}
              className={`rounded px-1.5 py-0.5 text-[9px] font-medium transition-colors ${
                nameFilter === null ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All Patterns
            </button>
            {allPatternNames.map(name => (
              <button
                key={name}
                onClick={() => setNameFilter(nameFilter === name ? null : name)}
                className={`rounded px-1.5 py-0.5 text-[9px] font-medium transition-colors ${
                  nameFilter === name ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Scanning indicator */}
      {scanning && (
        <div className="flex items-center gap-2 border-b border-border bg-secondary/50 px-4 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-dot" />
          <span className="text-[10px] text-muted-foreground">
            Scanning {scanProgress.current}/{scanProgress.total}
          </span>
          <div className="flex-1">
            <div className="h-0.5 rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: scanProgress.total > 0 ? `${(scanProgress.current / scanProgress.total) * 100}%` : '0%' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Grouped patterns */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {filteredGroups.length === 0 && !scanning && (
            <div className="py-16 text-center text-xs text-muted-foreground">
              {groups.length === 0
                ? 'No patterns detected yet. Scanning starts automatically every 5 minutes.'
                : 'No patterns match the current filters.'}
            </div>
          )}

          {filteredGroups.map((group) => (
            <div key={group.timeframe}>
              <div className="flex items-center gap-2 mb-2">
                <span className="rounded bg-accent/20 px-2 py-0.5 text-[10px] font-bold text-accent">
                  {group.label}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {group.patterns.length} pattern{group.patterns.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="grid gap-1.5">
                {group.patterns.map((dp) => (
                  <PatternCard key={dp.id} pattern={dp} onNameClick={setNameFilter} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function PatternCard({ pattern: dp, onNameClick }: { pattern: DetectedPattern; onNameClick: (name: string) => void }) {
  const p = dp.pattern;
  const isBull = p.type === 'bullish';
  const isBear = p.type === 'bearish';
  const timeAgo = getTimeAgo(dp.detectedAt);

  return (
    <div
      className="flex items-start gap-3 rounded border px-3 py-2"
      style={{
        borderColor: isBull
          ? 'hsl(142 72% 45% / 0.2)'
          : isBear
          ? 'hsl(0 72% 50% / 0.2)'
          : 'hsl(var(--border))',
        backgroundColor: isBull
          ? 'hsl(142 72% 45% / 0.03)'
          : isBear
          ? 'hsl(0 72% 50% / 0.03)'
          : 'transparent',
      }}
    >
      <div className="flex-shrink-0 pt-0.5">
        {isBull ? (
          <TrendingUp className="h-3.5 w-3.5 trend-bull" />
        ) : isBear ? (
          <TrendingDown className="h-3.5 w-3.5 trend-bear" />
        ) : (
          <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-foreground">{dp.symbol}</span>
          <button
            onClick={() => onNameClick(p.name)}
            className="text-[10px] font-semibold hover:underline cursor-pointer"
            style={{
              color: isBull ? 'hsl(var(--trend-bull))' : isBear ? 'hsl(var(--trend-bear))' : 'hsl(var(--muted-foreground))',
            }}
          >
            {p.name}
          </button>
          <Badge
            variant={p.significance === 'high' ? 'default' : p.significance === 'medium' ? 'secondary' : 'outline'}
            className="text-[8px] px-1.5 py-0"
          >
            {p.significance}
          </Badge>
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5">{p.description}</p>
        <div className="flex items-center gap-2 mt-1 text-[9px] text-muted-foreground">
          <span className="tabular-nums">${dp.price < 1 ? dp.price.toPrecision(4) : dp.price.toFixed(2)}</span>
          <span className="flex items-center gap-0.5">
            <Clock className="h-2.5 w-2.5" />
            {timeAgo}
          </span>
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
