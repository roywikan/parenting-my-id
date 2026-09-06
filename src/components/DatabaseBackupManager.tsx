import React, { useState, useEffect } from 'react';
import { 
  Database, Download, Copy, Check, RefreshCw, FileCode, 
  Table, Layers, CheckSquare, Square, Terminal, 
  FileText, ShieldCheck, AlertCircle, Info, Sparkles, ExternalLink
} from 'lucide-react';
import { DatabaseTableInfo, SiteConfig } from '../types';
import { getAuthHeaders } from '../lib/auth';

interface DatabaseBackupManagerProps {
  siteConfig?: SiteConfig;
}

export default function DatabaseBackupManager({ siteConfig }: DatabaseBackupManagerProps) {
  const [subTab, setSubTab] = useState<'dump' | 'schema_only' | 'queries'>('dump');
  
  // Table states
  const [tables, setTables] = useState<DatabaseTableInfo[]>([]);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [tableError, setTableError] = useState('');

  // Schema Only states
  const [schemaSql, setSchemaSql] = useState('');
  const [isLoadingSchema, setIsLoadingSchema] = useState(false);

  // Dump Options
  const [includeSchema, setIncludeSchema] = useState(true);
  const [includeData, setIncludeData] = useState(true);
  const [insertMode, setInsertMode] = useState<'INSERT OR REPLACE INTO' | 'INSERT INTO'>('INSERT OR REPLACE INTO');
  const [addDropTable, setAddDropTable] = useState(false);

  // Dump Output states
  const [dumpSql, setDumpSql] = useState('');
  const [isGeneratingDump, setIsGeneratingDump] = useState(false);
  const [dumpStats, setDumpStats] = useState<{ totalTables: number; totalRows: number; sizeBytes: number } | null>(null);

  // Copy feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Selected table for Explore Data single query preview
  const [previewQueryTable, setPreviewQueryTable] = useState<string>('posts');

  const siteName = siteConfig?.site_name || 'Cloudflare D1';

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId((prev) => (prev === id ? null : prev));
    }, 2500);
  };

  const triggerDownload = (content: string, filename: string, type = 'text/plain;charset=utf-8') => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Fetch Tables
  const fetchTables = async () => {
    setIsLoadingTables(true);
    setTableError('');
    try {
      const res = await fetch('/api/database/tables', {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Gagal memuat daftar tabel`);
      }
      const data = await res.json();
      if (data.tables && Array.isArray(data.tables)) {
        setTables(data.tables);
        // Default select all tables
        const allNames = data.tables.map((t: DatabaseTableInfo) => t.name);
        setSelectedTables(allNames);
        if (allNames.length > 0 && !allNames.includes(previewQueryTable)) {
          setPreviewQueryTable(allNames[0]);
        }
      }
    } catch (err: any) {
      console.error('Error fetching database tables:', err);
      setTableError(err.message || 'Gagal memuat tabel');
    } finally {
      setIsLoadingTables(false);
    }
  };

  // Fetch Schema Only
  const fetchSchema = async () => {
    setIsLoadingSchema(true);
    try {
      const res = await fetch('/api/database/schema', {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.schema) {
        setSchemaSql(data.schema);
      }
    } catch (err: any) {
      console.error('Error fetching database schema:', err);
    } finally {
      setIsLoadingSchema(false);
    }
  };

  // Generate Dump
  const handleGenerateDump = async (autoDownload = false, format: 'sql' | 'json' = 'sql') => {
    if (selectedTables.length === 0) {
      alert('Pilih minimal satu tabel untuk di-dump.');
      return;
    }

    setIsGeneratingDump(true);
    try {
      const res = await fetch('/api/database/dump', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          tables: selectedTables,
          includeSchema,
          includeData,
          insertMode,
          addDropTable,
          format,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}: Gagal generate dump`);
      }

      const result = await res.json();
      const dateStr = new Date().toISOString().split('T')[0];
      const tableTag = selectedTables.length === tables.length ? 'full' : `${selectedTables.length}_tables`;

      if (format === 'sql') {
        setDumpSql(result.sql || '');
        setDumpStats(result.stats || null);

        if (autoDownload && result.sql) {
          const filename = result.filename || `d1_backup_${tableTag}_${dateStr}.sql`;
          triggerDownload(result.sql, filename, 'application/sql;charset=utf-8');
        }
      } else {
        // JSON format download
        const jsonContent = JSON.stringify(result.data || {}, null, 2);
        const filename = result.filename || `d1_backup_${tableTag}_${dateStr}.json`;
        triggerDownload(jsonContent, filename, 'application/json;charset=utf-8');
      }
    } catch (err: any) {
      console.error('Error generating dump:', err);
      alert(`Gagal membuat dump: ${err.message}`);
    } finally {
      setIsGeneratingDump(false);
    }
  };

  useEffect(() => {
    fetchTables();
    fetchSchema();
  }, []);

  const toggleTableSelection = (tableName: string) => {
    setSelectedTables((prev) =>
      prev.includes(tableName) ? prev.filter((t) => t !== tableName) : [...prev, tableName]
    );
  };

  const selectAllTables = () => {
    setSelectedTables(tables.map((t) => t.name));
  };

  const deselectAllTables = () => {
    setSelectedTables([]);
  };

  const totalSelectedRows = tables
    .filter((t) => selectedTables.includes(t.name))
    .reduce((sum, t) => sum + (t.rowCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner & Info Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white shadow-md border border-slate-700/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Database className="w-5 h-5" />
              </span>
              <h2 className="text-base sm:text-lg font-bold">
                Manajemen Backup Database & Skema D1
              </h2>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">
                Cloudflare D1 (SQLite)
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Unduh skema DDL (<code className="text-indigo-300">CREATE TABLE</code>) saja atau ekspor skema beserta seluruh baris data (<code className="text-indigo-300">INSERT</code>) per tabel secara selektif. Hasil ekspor siap diimpor ke Cloudflare D1 via tab <strong>Explore Data</strong> atau <strong>Wrangler CLI</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center shrink-0">
            <button
              onClick={() => {
                fetchTables();
                fetchSchema();
              }}
              disabled={isLoadingTables}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingTables ? 'animate-spin' : ''}`} />
              <span>Refresh Tabel</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-700/60 text-xs">
          <div>
            <div className="text-slate-400 text-[11px]">Total Tabel Terdeteksi</div>
            <div className="text-base font-bold text-white mt-0.5">{tables.length} Tabel</div>
          </div>
          <div>
            <div className="text-slate-400 text-[11px]">Tabel Dipilih</div>
            <div className="text-base font-bold text-indigo-300 mt-0.5">
              {selectedTables.length} / {tables.length}
            </div>
          </div>
          <div>
            <div className="text-slate-400 text-[11px]">Total Baris Dipilih</div>
            <div className="text-base font-bold text-emerald-300 mt-0.5">
              ~{totalSelectedRows.toLocaleString()} Records
            </div>
          </div>
          <div>
            <div className="text-slate-400 text-[11px]">Kompatibilitas</div>
            <div className="text-base font-bold text-amber-300 mt-0.5">SQLite / Cloudflare D1</div>
          </div>
        </div>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSubTab('dump')}
          className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-colors flex items-center gap-2 shrink-0 ${
            subTab === 'dump'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Ekspor Skema + Isi Data (Opsional Tabel)</span>
        </button>

        <button
          onClick={() => setSubTab('schema_only')}
          className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-colors flex items-center gap-2 shrink-0 ${
            subTab === 'schema_only'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>Skema Saja (CREATE TABLE DDL)</span>
        </button>

        <button
          onClick={() => setSubTab('queries')}
          className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-colors flex items-center gap-2 shrink-0 ${
            subTab === 'queries'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Panduan Query Explore Data D1</span>
        </button>
      </div>

      {/* SUBTAB 1: DUMP SCHEMA + DATA (OPSIONAL TABELS) */}
      {subTab === 'dump' && (
        <div className="space-y-6">
          {/* Table Selector Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Table className="w-4 h-4 text-rose-500" />
                  <span>Pilih Tabel Database yang Ingin Diekspor</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Centang tabel tertentu atau pilih seluruhnya untuk mengekspor skema dan baris data.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAllTables}
                  className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors border border-rose-200 dark:border-rose-900/50 flex items-center gap-1"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Pilih Semua</span>
                </button>
                <button
                  type="button"
                  onClick={deselectAllTables}
                  className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 flex items-center gap-1"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Batal Pilih</span>
                </button>
              </div>
            </div>

            {tableError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 border border-rose-200 dark:border-rose-900/50">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{tableError}</span>
              </div>
            )}

            {/* Table Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {tables.map((t) => {
                const isChecked = selectedTables.includes(t.name);
                return (
                  <div
                    key={t.name}
                    onClick={() => toggleTableSelection(t.name)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none flex items-start justify-between gap-3 ${
                      isChecked
                        ? 'border-rose-500/70 bg-rose-50/50 dark:bg-rose-950/20 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {t.name}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold shrink-0">
                          {t.rowCount} baris
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug truncate">
                        {t.description || `Tabel ${t.name}`}
                      </p>
                    </div>

                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}} // Handled by parent div
                      className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500 shrink-0 mt-0.5 cursor-pointer"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Export Options & Settings */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-rose-500" />
              <span>Opsi & Format Ekspor Database</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Left Column: Toggles */}
              <div className="space-y-2.5">
                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 cursor-pointer hover:bg-slate-100/70 dark:hover:bg-slate-900">
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">Sertakan Skema CREATE TABLE</div>
                    <div className="text-[11px] text-slate-500">Membuat struktur tabel jika belum ada di database tujuan</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={includeSchema}
                    onChange={(e) => setIncludeSchema(e.target.checked)}
                    className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500 ml-3"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 cursor-pointer hover:bg-slate-100/70 dark:hover:bg-slate-900">
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">Sertakan Seluruh Baris Data</div>
                    <div className="text-[11px] text-slate-500">Menghasilkan statement INSERT untuk setiap baris rekaman</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={includeData}
                    onChange={(e) => setIncludeData(e.target.checked)}
                    className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500 ml-3"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 cursor-pointer hover:bg-slate-100/70 dark:hover:bg-slate-900">
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">Tambahkan DROP TABLE IF EXISTS</div>
                    <div className="text-[11px] text-slate-500">Menghapus tabel lama sebelum membuat baru (opsi reset bersih)</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={addDropTable}
                    onChange={(e) => setAddDropTable(e.target.checked)}
                    className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500 ml-3"
                  />
                </label>
              </div>

              {/* Right Column: Insert Mode & Summary */}
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                  <div className="font-bold text-slate-800 dark:text-slate-200 mb-2">Mode Pernyataan INSERT SQL</div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="insertMode"
                        value="INSERT OR REPLACE INTO"
                        checked={insertMode === 'INSERT OR REPLACE INTO'}
                        onChange={() => setInsertMode('INSERT OR REPLACE INTO')}
                        className="w-3.5 h-3.5 text-rose-600 focus:ring-rose-500"
                      />
                      <span className="text-xs text-slate-700 dark:text-slate-300">
                        <code className="font-bold text-rose-600 dark:text-rose-400">INSERT OR REPLACE INTO</code> (Rekomendasi: update jika ID sudah ada)
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="insertMode"
                        value="INSERT INTO"
                        checked={insertMode === 'INSERT INTO'}
                        onChange={() => setInsertMode('INSERT INTO')}
                        className="w-3.5 h-3.5 text-rose-600 focus:ring-rose-500"
                      />
                      <span className="text-xs text-slate-700 dark:text-slate-300">
                        <code className="font-bold text-rose-600 dark:text-rose-400">INSERT INTO</code> (Standar)
                      </span>
                    </label>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-[11px] text-indigo-900 dark:text-indigo-200 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-indigo-700 dark:text-indigo-400">
                    <Info className="w-3.5 h-3.5" />
                    <span>Keamanan & Integritas Dump</span>
                  </div>
                  <p className="leading-relaxed">
                    Dump ini menggunakan transaksi aman (<code className="font-mono">PRAGMA foreign_keys = OFF;</code> dan blok <code className="font-mono">COMMIT;</code>) agar seluruh tabel dapat diimpor tanpa kesalahan urutan relasi kunci asing.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons Bar */}
            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => handleGenerateDump(true, 'sql')}
                disabled={isGeneratingDump || selectedTables.length === 0}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isGeneratingDump ? 'Memproses Dump...' : 'Download SQL Backup (.sql)'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleGenerateDump(false, 'sql')}
                disabled={isGeneratingDump || selectedTables.length === 0}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold text-xs transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <FileCode className="w-4 h-4" />
                <span>Generate & Preview SQL</span>
              </button>

              <button
                type="button"
                onClick={() => handleGenerateDump(true, 'json')}
                disabled={isGeneratingDump || selectedTables.length === 0}
                className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-emerald-500" />
                <span>Download JSON Backup (.json)</span>
              </button>
            </div>
          </div>

          {/* Dump Preview Box (if generated) */}
          {dumpSql && (
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-emerald-500" />
                    <span>Hasil Dump SQL ({dumpStats ? `${dumpStats.totalTables} Tabel, ${dumpStats.totalRows} Baris` : ''})</span>
                  </h3>
                  {dumpStats && (
                    <p className="text-[11px] text-slate-500">
                      Ukuran estimasi: ~{(dumpStats.sizeBytes / 1024).toFixed(1)} KB
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(dumpSql, 'dump')}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5"
                  >
                    {copiedId === 'dump' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-600 dark:text-emerald-400">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin SQL</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => triggerDownload(dumpSql, `d1_backup_${new Date().toISOString().split('T')[0]}.sql`)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>

              <div className="relative">
                <textarea
                  readOnly
                  value={dumpSql}
                  rows={14}
                  className="w-full p-3.5 rounded-xl font-mono text-[11px] leading-relaxed bg-slate-950 text-slate-200 border border-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500 selection:bg-rose-900 selection:text-white"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: SCHEMA ONLY (CREATE TABLE DDL) */}
      {subTab === 'schema_only' && (
        <div className="space-y-5">
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-indigo-500" />
                  <span>Skema SQL Database D1 Saja (CREATE TABLE DDL)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Berisi seluruh perintah <code className="font-bold text-indigo-600 dark:text-indigo-400">CREATE TABLE IF NOT EXISTS</code> untuk menginisialisasi database D1 dari nol tanpa isi data rekaman.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => copyToClipboard(schemaSql, 'schema')}
                  disabled={!schemaSql}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5"
                >
                  {copiedId === 'schema' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Semua Skema</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => triggerDownload(schemaSql, 'd1_schema.sql', 'application/sql;charset=utf-8')}
                  disabled={!schemaSql}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download schema.sql</span>
                </button>
              </div>
            </div>

            {isLoadingSchema ? (
              <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-rose-500" />
                <span>Memuat skema dari database D1...</span>
              </div>
            ) : (
              <div className="relative">
                <textarea
                  readOnly
                  value={schemaSql || '-- Belum ada skema yang dimuat.'}
                  rows={18}
                  className="w-full p-4 rounded-xl font-mono text-[11px] leading-relaxed bg-slate-950 text-slate-200 border border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 selection:bg-indigo-900 selection:text-white"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 3: EXPLORE DATA QUERY COMMANDS */}
      {subTab === 'queries' && (
        <div className="space-y-5">
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-amber-500" />
                <span>Kompilasi Perintah Query Explore Data Cloudflare D1</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Berikut adalah perintah SQL yang dapat langsung Anda jalankan di Cloudflare Dashboard ➔ <strong>Workers & Pages</strong> ➔ <strong>D1</strong> ➔ Pilih Database ➔ Tab <strong>Explore Data</strong>:
              </p>
            </div>

            {/* Query 1: SQL Schema Saja */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center text-[10px]">1</span>
                  <span>Menampilkan SQL Schema Saja (Seluruh CREATE TABLE)</span>
                </div>
                <button
                  onClick={() =>
                    copyToClipboard(
                      "SELECT sql FROM sqlite_master WHERE type = 'table' AND name NOT LIKE '_cf_%' AND name NOT LIKE 'sqlite_%';",
                      'q1'
                    )
                  }
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1"
                >
                  {copiedId === 'q1' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedId === 'q1' ? 'Tersalin' : 'Salin SQL'}</span>
                </button>
              </div>
              <pre className="p-3 rounded-lg bg-slate-900 text-amber-300 font-mono text-[11px] overflow-x-auto select-all">
                SELECT sql FROM sqlite_master WHERE type = 'table' AND name NOT LIKE '_cf_%' AND name NOT LIKE 'sqlite_%';
              </pre>
              <p className="text-[11px] text-slate-500">
                Menampilkan seluruh perintah <code className="font-mono text-rose-500">CREATE TABLE</code> untuk setiap tabel yang ada di Cloudflare D1 Anda.
              </p>
            </div>

            {/* Query 2: Daftar Nama Tabel */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center text-[10px]">2</span>
                  <span>Menampilkan Daftar Nama Tabel Saja</span>
                </div>
                <button
                  onClick={() =>
                    copyToClipboard(
                      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE '_cf_%' AND name NOT LIKE 'sqlite_%';",
                      'q2'
                    )
                  }
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1"
                >
                  {copiedId === 'q2' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedId === 'q2' ? 'Tersalin' : 'Salin SQL'}</span>
                </button>
              </div>
              <pre className="p-3 rounded-lg bg-slate-900 text-indigo-300 font-mono text-[11px] overflow-x-auto select-all">
                SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE '_cf_%' AND name NOT LIKE 'sqlite_%';
              </pre>
              <p className="text-[11px] text-slate-500">
                Menampilkan daftar nama tabel aktif tanpa menyertakan metadata internal Cloudflare D1.
              </p>
            </div>

            {/* Query 3: Menampilkan Isi Data per Tabel */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center text-[10px]">3</span>
                  <span>Menampilkan Isi Data per Tabel (Query Interface)</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[11px] text-slate-500 font-medium">Pilih Tabel:</label>
                  <select
                    value={previewQueryTable}
                    onChange={(e) => setPreviewQueryTable(e.target.value)}
                    className="px-2 py-1 rounded-lg text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
                  >
                    {tables.map((t) => (
                      <option key={t.name} value={t.name}>
                        {t.name} ({t.rowCount} baris)
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => copyToClipboard(`SELECT * FROM ${previewQueryTable};`, 'q3')}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1"
                  >
                    {copiedId === 'q3' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedId === 'q3' ? 'Tersalin' : 'Salin SQL'}</span>
                  </button>
                </div>
              </div>
              <pre className="p-3 rounded-lg bg-slate-900 text-emerald-300 font-mono text-[11px] overflow-x-auto select-all">
                SELECT * FROM {previewQueryTable};
              </pre>
              <p className="text-[11px] text-slate-500">
                Jalankan perintah ini di tab Explore Data untuk melihat seluruh baris rekaman pada tabel <code className="font-mono text-emerald-500">{previewQueryTable}</code>.
              </p>
            </div>

            {/* CLI Command: Wrangler Execute Backup */}
            <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/20 space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-bold text-xs text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Cara Impor / Eksekusi File Backup via Cloudflare Wrangler CLI</span>
                </div>
                <button
                  onClick={() =>
                    copyToClipboard(
                      'npx wrangler d1 execute <DATABASE_NAME> --remote --file=./backup.sql',
                      'cli'
                    )
                  }
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-indigo-700 dark:text-indigo-300 transition-colors flex items-center gap-1"
                >
                  {copiedId === 'cli' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedId === 'cli' ? 'Tersalin' : 'Salin Perintah'}</span>
                </button>
              </div>
              <pre className="p-3 rounded-lg bg-slate-950 text-slate-200 font-mono text-[11px] overflow-x-auto select-all">
                npx wrangler d1 execute &lt;DATABASE_NAME&gt; --remote --file=./backup.sql
              </pre>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Ganti <code className="font-mono text-indigo-600 dark:text-indigo-400">&lt;DATABASE_NAME&gt;</code> dengan nama database D1 Anda di Cloudflare (misal: <code className="font-mono">parenting_db</code>) untuk memulihkan seluruh struktur dan data secara instan.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
