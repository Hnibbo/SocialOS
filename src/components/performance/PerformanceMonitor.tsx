import { useEffect, useState } from 'react';
import { PerformanceMonitor as PerfMonitor } from '@/lib/utils/performance';
import { Activity, Clock, Zap, AlertTriangle, BarChart3 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface PerformanceStats {
  avgPageLoad: number;
  avgApiCall: number;
  avgRender: number;
  totalInteractions: number;
}

export function PerformanceMonitor() {
  const [stats, setStats] = useState<PerformanceStats>({
    avgPageLoad: 0,
    avgApiCall: 0,
    avgRender: 0,
    totalInteractions: 0,
  });
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Update stats every 5 seconds
    const interval = setInterval(() => {
      const summary = PerfMonitor.getSummary();
      setStats(summary);
    }, 5000);

    // Initial update
    const initialSummary = PerfMonitor.getSummary();
    setStats(initialSummary);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (ms: number) => `${Math.round(ms)}ms`;
  const formatCount = (count: number) => count.toLocaleString();

  const getPerformanceColor = (ms: number): 'text-green-500' | 'text-yellow-500' | 'text-red-500' => {
    if (ms < 500) return 'text-green-500';
    if (ms < 1000) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getPerformanceBadge = (ms: number): 'success' | 'warning' | 'error' => {
    if (ms < 500) return 'success';
    if (ms < 1000) return 'warning';
    return 'error';
  };

  return (
    <Card className="w-full max-w-md bg-black/80 backdrop-blur-md border-white/10 text-white">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            <h3 className="font-semibold">Performance Monitor</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="text-white hover:bg-white/10"
          >
            {showDetails ? 'Hide' : 'Details'}
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Page Load
            </span>
            <span className={`text-lg font-bold ${getPerformanceColor(stats.avgPageLoad)}`}>
              {formatTime(stats.avgPageLoad)}
            </span>
            <Badge variant={getPerformanceBadge(stats.avgPageLoad)} className="w-fit text-xs">
              {getPerformanceBadge(stats.avgPageLoad)}
            </Badge>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Activity className="w-3 h-3" /> API Call
            </span>
            <span className={`text-lg font-bold ${getPerformanceColor(stats.avgApiCall)}`}>
              {formatTime(stats.avgApiCall)}
            </span>
            <Badge variant={getPerformanceBadge(stats.avgApiCall)} className="w-fit text-xs">
              {getPerformanceBadge(stats.avgApiCall)}
            </Badge>
          </div>
        </div>

        {/* Detailed Stats */}
        {showDetails && (
          <div className="space-y-3 pt-3 border-t border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <BarChart3 className="w-3 h-3" /> Render Time
              </span>
              <span className={`text-sm font-semibold ${getPerformanceColor(stats.avgRender)}`}>
                {formatTime(stats.avgRender)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Activity className="w-3 h-3" /> Interactions
              </span>
              <span className="text-sm font-semibold text-white">
                {formatCount(stats.totalInteractions)}
              </span>
            </div>

            {/* Slow Operations Warning */}
            {PerfMonitor.getSlowOperations().length > 0 && (
              <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded-md">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-semibold text-red-500">Slow Operations</span>
                </div>
                <p className="text-xs text-red-400">
                  {PerfMonitor.getSlowOperations().length} operation(s) took over 1 second
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
