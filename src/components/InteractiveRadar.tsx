import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as Icons from 'lucide-react';
import { RadarWidgetConfig, RadarAxis } from '../types';

interface InteractiveRadarProps {
  config: RadarWidgetConfig;
}

// Simple dynamic icon renderer
function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const IconComponent = (Icons as any)[name] || Icons.Sparkles;
  return <IconComponent className={className} />;
}

export default function InteractiveRadar({ config }: InteractiveRadarProps) {
  const { widgetTitle, widgetDescription, axes = [], profiles = [] } = config;

  // Initialize scores map from default values
  const [scores, setScores] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    axes.forEach((axis) => {
      initial[axis.id] = axis.defaultValue ?? 5;
    });
    return initial;
  });

  // Handle score updates
  const handleScoreChange = (axisId: string, val: number) => {
    setScores((prev) => ({
      ...prev,
      [axisId]: val,
    }));
  };

  // N-axis angle calculations
  const N = axes.length;
  const centerX = 150;
  const centerY = 150;
  const maxRadius = 90; // maximum SVG radius

  // Calculate coordinates for a given axis index and score (1-10)
  const getCoordinates = (index: number, score: number) => {
    const angle = (2 * Math.PI * index) / N - Math.PI / 2;
    const r = (score / 10) * maxRadius;
    const x = centerX + r * Math.cos(angle);
    const y = centerY + r * Math.sin(angle);
    return { x, y };
  };

  // Generate SVG paths for background concentric grid polygons (levels 2, 4, 6, 8, 10)
  const gridLevels = [2, 4, 6, 8, 10];
  const gridPolygons = useMemo(() => {
    return gridLevels.map((level) => {
      const points = [];
      for (let i = 0; i < N; i++) {
        const { x, y } = getCoordinates(i, level);
        points.push(`${x},${y}`);
      }
      return points.join(' ');
    });
  }, [N]);

  // Generate background lines from center to outer points
  const axisLines = useMemo(() => {
    return axes.map((_, i) => {
      const { x, y } = getCoordinates(i, 10);
      return { x1: centerX, y1: centerY, x2: x, y2: y };
    });
  }, [N, axes]);

  // Generate score polygon
  const scorePolygonPoints = useMemo(() => {
    const points = [];
    for (let i = 0; i < N; i++) {
      const axis = axes[i];
      const score = scores[axis.id] ?? 5;
      const { x, y } = getCoordinates(i, score);
      points.push(`${x},${y}`);
    }
    return points.join(' ');
  }, [scores, axes, N]);

  // Generate individual data dots
  const dataDots = useMemo(() => {
    const dots = [];
    for (let i = 0; i < N; i++) {
      const axis = axes[i];
      const score = scores[axis.id] ?? 5;
      dots.push({ ...getCoordinates(i, score), score, label: axis.label });
    }
    return dots;
  }, [scores, axes, N]);

  // Generate axis labels positioning around the radar
  const labelPositions = useMemo(() => {
    return axes.map((axis, i) => {
      const angle = (2 * Math.PI * i) / N - Math.PI / 2;
      // Offset labels further outward than the grid radius (105%)
      const r = maxRadius + 22;
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);
      
      // Fine-tune text-anchor and alignment based on position
      let textAnchor = 'middle';
      if (Math.cos(angle) > 0.1) {
        textAnchor = 'start';
      } else if (Math.cos(angle) < -0.1) {
        textAnchor = 'end';
      }

      let dy = '0.35em';
      if (Math.sin(angle) > 0.7) {
        dy = '1em'; // down
      } else if (Math.sin(angle) < -0.7) {
        dy = '-0.4em'; // up
      }

      return { x, y, label: axis.label, textAnchor, dy };
    });
  }, [N, axes]);

  // Real-time matching logic to find the best profiling result
  const activeProfile = useMemo(() => {
    if (!profiles || profiles.length === 0) return null;

    // 1. Try to find fully qualified profiles
    const qualified = profiles.filter((profile) => {
      if (!profile.minScores) return false;
      return Object.entries(profile.minScores).every(([axisId, minVal]) => {
        const userVal = scores[axisId] ?? 5;
        return userVal >= minVal;
      });
    });

    if (qualified.length > 0) {
      // Pick the one with the highest complexity/specific requirements sum
      return qualified.reduce((best, cur) => {
        const bestSum = Object.values(best.minScores || {}).reduce((a, b) => a + b, 0);
        const curSum = Object.values(cur.minScores || {}).reduce((a, b) => a + b, 0);
        return curSum > bestSum ? cur : best;
      });
    }

    // 2. Fallback: Find the profile with the minimum Manhattan distance
    let bestProfile = profiles[0];
    let minDiff = Infinity;

    profiles.forEach((profile) => {
      if (!profile.minScores) return;
      let diff = 0;
      Object.entries(profile.minScores).forEach(([axisId, minVal]) => {
        const userVal = scores[axisId] ?? 5;
        diff += Math.abs(userVal - minVal);
      });
      if (diff < minDiff) {
        minDiff = diff;
        bestProfile = profile;
      }
    });

    return bestProfile;
  }, [scores, profiles]);

  return (
    <div className="w-full max-w-6xl mx-auto my-12 p-5 sm:p-7 lg:p-8 rounded-3xl bg-[#fdfcf9] dark:bg-zinc-900/50 border border-[#f3eee0] dark:border-zinc-800 shadow-xs">
      
      {/* Title Header */}
      <div className="mb-8 text-center md:text-left max-w-3xl">
        <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-white mb-2 leading-tight">
          {widgetTitle}
        </h2>
        {widgetDescription && (
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            {widgetDescription}
          </p>
        )}
      </div>

      {/* Grid Layout Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column (5 columns): Control Sliders Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white/50 dark:bg-zinc-900/40 border border-[#f5f1e6] dark:border-zinc-800 rounded-2xl p-5 space-y-5">
            <h4 className="text-xs font-black tracking-widest text-slate-400 dark:text-zinc-500 uppercase pb-2 border-b border-dashed border-[#f5f1e6] dark:border-zinc-800">
              Sesuaikan Parameter Nilai
            </h4>
            
            <div className="space-y-4">
              {axes.map((axis) => {
                const curVal = scores[axis.id] ?? 5;
                return (
                  <div key={axis.id} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs sm:text-sm">
                      <span className="font-bold text-slate-700 dark:text-zinc-300">
                        {axis.label}
                      </span>
                      <span className="text-xs font-black text-[#e67e65] dark:text-rose-400 bg-[#fef2ee] dark:bg-rose-950/30 px-2 py-0.5 rounded-md">
                        {curVal}/10
                      </span>
                    </div>

                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="1"
                      value={curVal}
                      onChange={(e) => handleScoreChange(axis.id, parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#e67e65] dark:accent-rose-500"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (7 columns): Visual SVGs & Profiles */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            
            {/* Radar Diagram Column (5 columns in sub-grid) */}
            <div className="md:col-span-5 bg-white dark:bg-zinc-900 border border-[#f0eee6] dark:border-zinc-800 rounded-2xl p-4 flex flex-col items-center justify-center shadow-xs">
              <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/30 rounded-md uppercase tracking-wider mb-2">
                Radar Real-Time
              </span>

              {/* Responsive SVG Container */}
              <div className="w-full max-w-[240px] aspect-square relative">
                <svg
                  viewBox="0 0 300 300"
                  className="w-full h-full overflow-visible"
                >
                  {/* Concentric helper grids */}
                  {gridPolygons.map((points, idx) => (
                    <polygon
                      key={idx}
                      points={points}
                      className="fill-none stroke-slate-150 dark:stroke-zinc-850 stroke-1"
                      strokeDasharray={idx === gridPolygons.length - 1 ? 'none' : '2,2'}
                    />
                  ))}

                  {/* Axis line spines */}
                  {axisLines.map((line, idx) => (
                    <line
                      key={idx}
                      x1={line.x1}
                      y1={line.y1}
                      x2={line.x2}
                      y2={line.y2}
                      className="stroke-slate-150 dark:stroke-zinc-850 stroke-1"
                    />
                  ))}

                  {/* Active Shaded score area polygon */}
                  <polygon
                    points={scorePolygonPoints}
                    className="fill-rose-500/12 dark:fill-rose-400/20 stroke-[#e67e65] dark:stroke-rose-400 stroke-2 transition-all duration-300"
                  />

                  {/* Interactive score dots */}
                  {dataDots.map((dot, idx) => (
                    <circle
                      key={idx}
                      cx={dot.x}
                      cy={dot.y}
                      r="4"
                      className="fill-white stroke-[#e67e65] dark:stroke-rose-400 stroke-2 shadow-xs transition-all duration-300"
                    />
                  ))}

                  {/* Axis label positioning texts */}
                  {labelPositions.map((pos, idx) => (
                    <text
                      key={idx}
                      x={pos.x}
                      y={pos.y}
                      textAnchor={pos.textAnchor}
                      dy={pos.dy}
                      className="fill-slate-500 dark:fill-zinc-400 font-sans font-bold text-[9px] transition-all duration-300"
                    >
                      {pos.label}
                    </text>
                  ))}
                </svg>
              </div>
            </div>

            {/* Profile Result Card Column (7 columns in sub-grid) */}
            <div className="md:col-span-7">
              <AnimatePresence mode="wait">
                {activeProfile ? (
                  <motion.div
                    key={activeProfile.profileName}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    style={{
                      backgroundColor: activeProfile.cardThemeHex || '#FFF9F2',
                    }}
                    className="p-6 rounded-3xl border border-[#f0eee6] dark:border-zinc-800 text-slate-800 dark:text-zinc-100 shadow-xs min-h-[290px] flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 text-[9px] font-bold text-[#e67e65] dark:text-rose-400 bg-white dark:bg-zinc-800 rounded-full shadow-2xs border border-[#fde2d8] dark:border-zinc-700 uppercase tracking-widest">
                        Hasil Profiling
                      </span>

                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-serif leading-tight">
                          {activeProfile.profileName}
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed font-medium mt-1.5">
                          {activeProfile.description}
                        </p>
                      </div>

                      {/* Primary Strength and Critical Weakness details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {activeProfile.primaryStrength && (
                          <div className="p-2.5 bg-white/70 dark:bg-zinc-900/50 rounded-xl border border-white/40 dark:border-zinc-800">
                            <h5 className="text-[9px] font-black tracking-wider text-emerald-600 dark:text-emerald-400 uppercase">
                              💪 Kekuatan Utama
                            </h5>
                            <p className="text-[10px] text-slate-700 dark:text-zinc-300 font-medium leading-relaxed mt-0.5">
                              {activeProfile.primaryStrength}
                            </p>
                          </div>
                        )}
                        {activeProfile.criticalWeakness && (
                          <div className="p-2.5 bg-white/70 dark:bg-zinc-900/50 rounded-xl border border-white/40 dark:border-zinc-800">
                            <h5 className="text-[9px] font-black tracking-wider text-rose-600 dark:text-rose-400 uppercase">
                              ⚠️ Area Perbaikan
                            </h5>
                            <p className="text-[10px] text-slate-700 dark:text-zinc-300 font-medium leading-relaxed mt-0.5">
                              {activeProfile.criticalWeakness}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Tactical Actions Box */}
                      {activeProfile.actionSteps && activeProfile.actionSteps.length > 0 && (
                        <div className="bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/10 rounded-2xl p-4 mt-2">
                          <h5 className="text-[10px] font-black tracking-widest text-amber-700 dark:text-amber-400 uppercase mb-2">
                            Saran Praktis Hari Ini:
                          </h5>
                          <ul className="space-y-1.5">
                            {activeProfile.actionSteps.map((step, idx) => (
                              <li
                                key={idx}
                                className="flex items-start gap-2 text-xs text-slate-700 dark:text-zinc-300 font-medium leading-relaxed"
                              >
                                <span className="w-1 h-1 rounded-full bg-[#e67e65] dark:bg-rose-400 shrink-0 mt-1.5" />
                                <span>{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <div className="bg-white dark:bg-zinc-900 border border-[#f0eee6] dark:border-zinc-800 rounded-3xl p-6 text-center text-slate-400 font-medium min-h-[290px] flex items-center justify-center">
                    Harap sesuaikan slider di kiri untuk memicu kalkulasi profil hasil...
                  </div>
                )}
              </AnimatePresence>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
