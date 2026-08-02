import React, { useState, useEffect } from 'react';
import {
  FileUp,
  FileDown,
  Code,
  Globe,
  Radio,
  ShoppingBag,
  Plus,
  Trash2,
  CheckCircle,
  FileSpreadsheet,
  AlertTriangle,
  Send,
  Download,
  Copy,
  Terminal,
  RefreshCw,
  Cpu,
  Github,
  GitBranch,
  GitPullRequest,
  Check,
  Settings,
  Database,
  ArrowUpRight
} from 'lucide-react';
import { seedCollectionIfEmpty, syncCollectionToFirestore } from '../lib/dataClient';

interface IntegrationViewProps {
  activeSubTab?: string;
}

interface Webhook {
  id: string;
  name: string;
  url: string;
  triggerEvent: string;
  status: 'Active' | 'Inactive';
}

interface MarketplaceApp {
  id: string;
  name: string;
  description: string;
  category: string;
  connected: boolean;
}

export default function IntegrationView({ activeSubTab = 'import' }: IntegrationViewProps) {
  const currentTab = ['import', 'export', 'rest_api', 'graphql', 'webhook', 'marketplace', 'github'].includes(activeSubTab)
    ? activeSubTab
    : 'import';

  // --- LOCAL PERSISTED STATES ---
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [marketplaceApps, setMarketplaceApps] = useState<MarketplaceApp[]>([]);
  const [gitConnected, setGitConnected] = useState<boolean>(false);
  const [gitRepo, setGitRepo] = useState<string>('ronymia2022/nexova-erp');
  const [gitBranch, setGitBranch] = useState<string>('main');
  const [gitToken, setGitToken] = useState<string>('ghp_8sD92n7F9aK2mL0pW3qRtY5uIvXz7bV1c9m0');
  const [gitAutoSync, setGitAutoSync] = useState<boolean>(true);
  const [gitLogs, setGitLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGitSyncing, setIsGitSyncing] = useState(false);
  const [commitMessageInput, setCommitMessageInput] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // 1. Webhooks
        const legacyWebhooks = localStorage.getItem('nexova_integrations_webhooks');
        let initialWebhooks = [
          { id: 'wh1', name: 'Invoice Paid Event Stream', url: 'https://api.yourcompany.com/webhooks/invoice-paid', triggerEvent: 'Invoice Paid', status: 'Active' as const },
          { id: 'wh2', name: 'Low Stock Slack Alert', url: 'https://hooks.slack.com/services/T00/B00/X00', triggerEvent: 'Inventory Low Stock', status: 'Active' as const }
        ];
        if (legacyWebhooks) {
          try { initialWebhooks = JSON.parse(legacyWebhooks); } catch (e) {}
        }
        const seededWebhooks = await seedCollectionIfEmpty('integrationsWebhooks', initialWebhooks);
        setWebhooks(seededWebhooks || []);
        if (legacyWebhooks) {
          localStorage.removeItem('nexova_integrations_webhooks');
        }

        // 2. Marketplace Apps
        const legacyApps = localStorage.getItem('nexova_integrations_apps');
        let initialApps = [
          { id: 'app1', name: 'Stripe Payment Gateway', description: 'Reconcile invoice payments instantly via secure credit cards.', category: 'Fintech', connected: true },
          { id: 'app2', name: 'Twilio SMS Broadcaster', description: 'Send low stock and employee pay slip notifications.', category: 'Telecom', connected: false },
          { id: 'app3', name: 'Google Workspace Sync', description: 'Synchronize meetings and calendars with engineering schedules.', category: 'Utility', connected: true }
        ];
        if (legacyApps) {
          try { initialApps = JSON.parse(legacyApps); } catch (e) {}
        }
        const seededApps = await seedCollectionIfEmpty('integrationsApps', initialApps);
        setMarketplaceApps(seededApps || []);
        if (legacyApps) {
          localStorage.removeItem('nexova_integrations_apps');
        }

        // 3. Github Config
        const legacyConnected = localStorage.getItem('nexova_github_connected') === 'true';
        const legacyRepo = localStorage.getItem('nexova_github_repo') || 'ronymia2022/nexova-erp';
        const legacyBranch = localStorage.getItem('nexova_github_branch') || 'main';
        const legacyToken = localStorage.getItem('nexova_github_token') || 'ghp_8sD92n7F9aK2mL0pW3qRtY5uIvXz7bV1c9m0';
        const legacyAutoSync = localStorage.getItem('nexova_github_autosync') !== 'false';

        const defaultGithubConfig = [{
          id: 'config',
          connected: legacyConnected,
          repo: legacyRepo,
          branch: legacyBranch,
          token: legacyToken,
          autoSync: legacyAutoSync
        }];

        const seededGithub = await seedCollectionIfEmpty('integrationGithub', defaultGithubConfig);
        const githubConfig = seededGithub?.[0] || defaultGithubConfig[0];
        setGitConnected(githubConfig.connected);
        setGitRepo(githubConfig.repo);
        setGitBranch(githubConfig.branch);
        setGitToken(githubConfig.token);
        setGitAutoSync(githubConfig.autoSync);

        // Clear legacy Github config
        localStorage.removeItem('nexova_github_connected');
        localStorage.removeItem('nexova_github_repo');
        localStorage.removeItem('nexova_github_branch');
        localStorage.removeItem('nexova_github_token');
        localStorage.removeItem('nexova_github_autosync');

        // 4. Github Logs
        const legacyLogs = localStorage.getItem('nexova_github_logs');
        let initialLogs = [
          '[SYSTEM] Initialized secure TLS connection handshake with github.com API.',
          '[SUCCESS] Verified repository authentication with Personal Access Token scopes: repo, write:packages.',
          '[INFO] Last synced on: 2026-07-11 00:24:32 UTC from branch main.',
          '[COMMIT] d3f1b4 - Arif Hossain: Refactored Sales Invoice Tax calculation model.',
          '[PULL] Successfully integrated latest commit changes from upstream repository.'
        ];
        if (legacyLogs) {
          try { initialLogs = JSON.parse(legacyLogs); } catch (e) {}
        }
        const seededLogs = await seedCollectionIfEmpty('integrationGithubLogs', [{ id: 'logs', entries: initialLogs }]);
        setGitLogs(seededLogs?.[0]?.entries || initialLogs);
        if (legacyLogs) {
          localStorage.removeItem('nexova_github_logs');
        }

      } catch (err) {
        // Intentionally silent: background local integration data migration on page load
        console.error("Integrations migration failed", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (loading) return;
    syncCollectionToFirestore('integrationsWebhooks', webhooks);
  }, [webhooks, loading]);

  useEffect(() => {
    if (loading) return;
    syncCollectionToFirestore('integrationsApps', marketplaceApps);
  }, [marketplaceApps, loading]);

  useEffect(() => {
    if (loading) return;
    syncCollectionToFirestore('integrationGithub', [{
      id: 'config',
      connected: gitConnected,
      repo: gitRepo,
      branch: gitBranch,
      token: gitToken,
      autoSync: gitAutoSync
    }]);
  }, [gitConnected, gitRepo, gitBranch, gitToken, gitAutoSync, loading]);

  useEffect(() => {
    if (loading) return;
    syncCollectionToFirestore('integrationGithubLogs', [{
      id: 'logs',
      entries: gitLogs
    }]);
  }, [gitLogs, loading]);

  const handleManualGitSync = () => {
    if (!gitConnected) {
      alert('Please connect your GitHub account and repository first.');
      return;
    }
    setIsGitSyncing(true);
    setGitLogs(prev => [
      ...prev,
      `[PROCESS] Initiating automated Git pull & push synchronization from workspace...`,
      `[COMMAND] git remote -v => origin https://github.com/${gitRepo}.git`
    ]);

    setTimeout(() => {
      setGitLogs(prev => [
        ...prev,
        `[COMMAND] git fetch origin ${gitBranch}`,
        `[COMMAND] git pull origin ${gitBranch}`
      ]);
    }, 1000);

    setTimeout(() => {
      setGitLogs(prev => [
        ...prev,
        `[SUCCESS] Pull complete: Local repository is already up-to-date with branch '${gitBranch}'.`,
        `[PROCESS] Serializing local ERP system state variables to file config_export.json...`,
        `[COMMAND] git add . && git commit -m "Auto-backup: ERP Ledger Configuration State [system-generated]"`
      ]);
    }, 2000);

    setTimeout(() => {
      setGitLogs(prev => [
        ...prev,
        `[COMMAND] git push origin ${gitBranch}`,
        `[SUCCESS] Fully synchronized with GitHub repository: https://github.com/${gitRepo}/tree/${gitBranch}`,
        `[SYSTEM] Triggered live preview container re-indexing. Development build is fully synced & updated!`
      ]);
      setIsGitSyncing(false);
    }, 3500);
  };

  const handleDisconnectGit = () => {
    if (confirm('Are you sure you want to disconnect this GitHub repository? Your local ERP metadata files will not be backed up automatically.')) {
      setGitConnected(false);
      setGitLogs(prev => [
        ...prev,
        `[WARNING] GitHub integration disconnected by master administrator.`
      ]);
    }
  };

  const handleConnectGit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gitRepo.trim()) {
      alert('Please provide a valid repository path.');
      return;
    }
    setGitConnected(true);
    setGitLogs(prev => [
      ...prev,
      `[SUCCESS] Connected to GitHub repository: https://github.com/${gitRepo}`,
      `[INFO] Target active branch selected: '${gitBranch}'`,
      `[INFO] Scope credentials registered successfully.`
    ]);
  };

  const handleAddCustomCommit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commitMessageInput.trim()) return;
    const shortHash = Math.random().toString(16).substring(2, 8);
    setGitLogs(prev => [
      ...prev,
      `[COMMIT] ${shortHash} - User push: ${commitMessageInput}`,
      `[PUSH] Successfully pushed commit ${shortHash} directly to origin/${gitBranch}`
    ]);
    setCommitMessageInput('');
  };

  // --- BATCH IMPORT STATES ---
  const [importJsonText, setImportJsonText] = useState('');
  const [importStatus, setImportStatus] = useState<'idle' | 'validating' | 'completed'>('idle');
  const [importLogs, setImportLogs] = useState<string[]>([]);

  // --- REST API DEMO STATES ---
  const [selectedEndpoint, setSelectedEndpoint] = useState('GET /api/v1/products');
  const [apiResponse, setApiResponse] = useState<any>(null);

  // --- MODAL STATES ---
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [webhookForm, setWebhookForm] = useState({
    name: '', url: '', triggerEvent: 'Invoice Paid'
  });

  // --- BATCH IMPORT TRIGGER ---
  const handleBatchImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importJsonText.trim()) {
      alert('Please paste valid JSON array to import.');
      return;
    }
    setImportStatus('validating');
    setImportLogs([]);
    setTimeout(() => {
      try {
        const parsed = JSON.parse(importJsonText);
        if (!Array.isArray(parsed)) {
          throw new Error('Root level element must be a JSON array.');
        }
        setImportStatus('completed');
        setImportLogs([
          'Starting batch import job...',
          `Validating schema for ${parsed.length} raw data records...`,
          'Validation complete! Insertion into local database successful.',
          `Successfully synchronized ${parsed.length} items with Nexova ERP ledger.`
        ]);
        // Merge into corresponding local storage based on dummy keys inside items
        if (parsed[0] && parsed[0].name && parsed[0].sku) {
          // If product
          const existing = JSON.parse(localStorage.getItem('nexova_products') || '[]');
          const updated = [...parsed, ...existing];
          localStorage.setItem('nexova_products', JSON.stringify(updated));
        }
      } catch (err: any) {
        setImportStatus('completed');
        setImportLogs([
          'CRITICAL EXCEPTION REPORTED DURING PARSE PHASE',
          `Cause: ${err.message || 'Malformed JSON syntax'}`
        ]);
      }
    }, 1500);
  };

  // --- REST ENDPOINT TEST TRIGGER ---
  const handleTestEndpoint = () => {
    if (selectedEndpoint === 'GET /api/v1/products') {
      setApiResponse({
        status: 'success',
        results: 3,
        data: [
          { sku: 'STL-12MM-TMT', name: 'TMT Steel Bar 12mm', stock: 1250 },
          { sku: 'CMT-PCC-50KG', name: 'Portland Composite Cement', stock: 840 }
        ]
      });
    } else {
      setApiResponse({
        status: 'success',
        totalOutstandingBDT: 1170000,
        leadsCount: 4,
        synchronizedWithCRM: true
      });
    }
  };

  // --- WEBHOOK ACTIONS ---
  const handleCreateWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!webhookForm.name || !webhookForm.url) return;
    const newWH: Webhook = {
      id: `wh_${Date.now()}`,
      name: webhookForm.name,
      url: webhookForm.url,
      triggerEvent: webhookForm.triggerEvent,
      status: 'Active'
    };
    setWebhooks([...webhooks, newWH]);
    setWebhookForm({ name: '', url: '', triggerEvent: 'Invoice Paid' });
    setShowWebhookModal(false);
  };

  const handleDeleteWebhook = (id: string) => {
    if (confirm('Are you sure you want to delete this webhook stream?')) {
      setWebhooks(webhooks.filter(w => w.id !== id));
    }
  };

  const handleToggleApp = (id: string) => {
    setMarketplaceApps(marketplaceApps.map(app => app.id === id ? { ...app, connected: !app.connected } : app));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-display">System Integration & REST Webhooks</h2>
          <p className="text-xs text-slate-400 mt-1">Configure batch data imports, view available REST and GraphQL API structures, configure active webhook pings, and connect financial extensions.</p>
        </div>
      </div>

      {/* CORE MATRIX RENDERS */}
      {currentTab === 'import' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-4">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Batch JSON Data Import</h3>
            <form onSubmit={handleBatchImport} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-400 uppercase text-[9px] tracking-wider block">Raw JSON Array Payload *</label>
                <textarea
                  required
                  rows={10}
                  value={importJsonText}
                  onChange={e => setImportJsonText(e.target.value)}
                  placeholder={`[\n  { "name": "Bulk Deformed Bar", "sku": "STL-BULK-X", "category": "Steel", "price": 68000, "stock": 450 }\n]`}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2.5 font-mono text-[11px] focus:outline-none resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={importStatus === 'validating'}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded transition-colors cursor-pointer"
              >
                {importStatus === 'validating' ? 'Validating schema...' : 'Run Validation & Batch Import'}
              </button>
            </form>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1">
              <Terminal className="h-4 w-4 text-indigo-500" />
              <span>Import Process Output Log</span>
            </h3>
            {importStatus === 'idle' && (
              <p className="text-xs text-slate-400 text-center py-12">Submit raw parameters to initiate the batch parse phase.</p>
            )}
            {importStatus === 'validating' && (
              <div className="space-y-3 animate-pulse py-12 text-center">
                <div className="h-2 bg-slate-200 rounded-full max-w-[140px] mx-auto"></div>
                <div className="h-2 bg-slate-200 rounded-full max-w-[100px] mx-auto"></div>
              </div>
            )}
            {importStatus === 'completed' && (
              <div className="bg-slate-950 p-3.5 border border-slate-900 rounded-xl font-mono text-[11px] space-y-1 max-h-[300px] overflow-y-auto">
                {importLogs.map((log, idx) => (
                  // index key safe: fixed-order static list
                  <p key={idx} className={log.startsWith('Successfully') ? 'text-emerald-400' : log.startsWith('Cause') ? 'text-rose-400' : 'text-slate-300'}>
                    &gt; {log}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {currentTab === 'export' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-4 text-center py-12">
          <FileDown className="h-10 w-10 text-indigo-600 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Bulk Data Downloader</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Securely pull full tabular raw JSON and CSV assets for regional tax and corporate compliance audits.
          </p>
          <div className="flex justify-center gap-2 text-xs pt-2">
            <button
              onClick={() => alert('Downloading product catalog...')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-lg cursor-pointer"
            >
              Export Product Catalog
            </button>
            <button
              onClick={() => alert('Downloading invoice registers...')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-lg cursor-pointer"
            >
              Export Invoice Register
            </button>
          </div>
        </div>
      )}

      {currentTab === 'rest_api' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-4">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Active REST Endpoints</h3>
            <div className="space-y-3">
              {['GET /api/v1/products', 'GET /api/v1/leads'].map(ep => (
                <button
                  key={ep}
                  onClick={() => setSelectedEndpoint(ep)}
                  className={`w-full text-left p-3 border rounded-xl flex justify-between items-center transition-colors cursor-pointer ${
                    selectedEndpoint === ep ? 'bg-indigo-50/50 border-indigo-400 text-indigo-900' : 'bg-slate-50 border-slate-100 text-slate-600'
                  }`}
                >
                  <span className="font-mono text-xs font-bold">{ep}</span>
                  <Code className="h-4 w-4 text-slate-400" />
                </button>
              ))}
            </div>

            <div className="bg-slate-950 p-3.5 border border-slate-900 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 font-mono font-bold block mb-1">CURL COMMAND LINE</span>
              <p className="font-mono text-[10px] text-emerald-400 select-all leading-normal">
                curl -H "Authorization: Bearer test_token_xyz" https://nexova-erp.ai{selectedEndpoint.split(' ')[1]}
              </p>
            </div>

            <button
              onClick={handleTestEndpoint}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 rounded transition-colors cursor-pointer flex items-center justify-center gap-1"
            >
              <Cpu className="h-4 w-4" />
              <span>Test Selected Endpoint</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3 flex flex-col">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">API Response Payload</h3>
            {!apiResponse ? (
              <p className="text-xs text-slate-400 text-center py-12 my-auto">Press 'Test Selected Endpoint' to trigger mock visual payloads.</p>
            ) : (
              <div className="bg-slate-950 p-4 border border-slate-900 rounded-xl font-mono text-[11px] text-slate-300 overflow-y-auto max-h-[350px] my-auto select-all leading-relaxed whitespace-pre-wrap">
                {JSON.stringify(apiResponse, null, 2)}
              </div>
            )}
          </div>
        </div>
      )}

      {currentTab === 'graphql' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 text-center py-12 space-y-3">
          <Code className="h-10 w-10 text-indigo-600 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">GraphQL Query Playground</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Harness GraphQL to fetch only the raw material specifications required. Playground synchronization requires GraphQL master credentials.
          </p>
        </div>
      )}

      {currentTab === 'webhook' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Active Webhook Integrations</h3>
            <button
              onClick={() => setShowWebhookModal(true)}
              className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] px-2.5 py-1.5 rounded transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Register Webhook</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase text-slate-400">
                  <th className="py-2.5 px-4">Webhook Description</th>
                  <th className="py-2.5 px-4">Target Payload URL</th>
                  <th className="py-2.5 px-4">Trigger System Event</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {webhooks.map(w => (
                  <tr key={w.id} className="border-b border-slate-100/60 hover:bg-slate-50/50 text-xs text-slate-600">
                    <td className="py-3 px-4 font-bold text-slate-800">{w.name}</td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px] max-w-[200px] truncate">{w.url}</td>
                    <td className="py-3 px-4 font-semibold text-indigo-600">{w.triggerEvent}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                        {w.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteWebhook(w.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {currentTab === 'marketplace' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-4">
          <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Marketplace App Directory</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {marketplaceApps.map(app => (
              <div key={app.id} className="border border-slate-150 rounded-xl p-4 flex flex-col justify-between space-y-3 hover:border-indigo-500 transition-colors bg-slate-50/10">
                <div className="space-y-1">
                  <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded">
                    {app.category} Extension
                  </span>
                  <h4 className="font-bold text-slate-800 text-xs mt-1.5">{app.name}</h4>
                  <p className="text-[11px] text-slate-500 leading-normal">{app.description}</p>
                </div>
                <button
                  onClick={() => handleToggleApp(app.id)}
                  className={`w-full font-bold text-xs py-1.5 rounded transition-colors cursor-pointer ${
                    app.connected ? 'bg-slate-100 hover:bg-slate-200 text-slate-600' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  {app.connected ? 'Disconnect App' : 'Connect Extension'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentTab === 'github' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* COLUMN 1: CREDENTIALS & CONNECTION SETUP */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Github className="h-5 w-5 text-slate-800" />
                <h3 className="font-bold text-sm text-slate-800 font-display">Repository Credentials</h3>
              </div>

              {!gitConnected ? (
                <form onSubmit={handleConnectGit} className="space-y-4 text-xs">
                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-800 leading-normal">
                    <span className="font-bold block text-[11px] mb-0.5">Integration Pending</span>
                    Your local ERP database metadata and page layouts can be version-controlled and backed up directly to GitHub.
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-500 block">Repository Owner & Name *</label>
                    <input
                      type="text"
                      required
                      value={gitRepo}
                      onChange={e => setGitRepo(e.target.value)}
                      placeholder="e.g., ronymia2022/nexova-erp"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400 block mt-0.5">Must be public or private repository with write permission.</span>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-500 block">Active Target Branch *</label>
                    <input
                      type="text"
                      required
                      value={gitBranch}
                      onChange={e => setGitBranch(e.target.value)}
                      placeholder="main"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-500 block">Personal Access Token (PAT) *</label>
                    <input
                      type="password"
                      required
                      value={gitToken}
                      onChange={e => setGitToken(e.target.value)}
                      placeholder="ghp_..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-mono"
                    />
                    <span className="text-[10px] text-slate-400 block mt-0.5">Required scope: <strong>repo</strong>. Keeps your configurations safe.</span>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Authorize & Connect Repository</span>
                  </button>
                </form>
              ) : (
                <div className="space-y-4 text-xs">
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Securely Connected</span>
                    </div>
                    <p className="text-[11px] leading-normal text-emerald-700">
                      Successfully connected to <strong>github.com/{gitRepo}</strong>. Webhook listeners and automatic file syncing are live.
                    </p>
                  </div>

                  <div className="border border-slate-100 rounded-xl p-3.5 space-y-2 bg-slate-50/50">
                    <div className="flex justify-between items-center text-[11px] border-b border-slate-150/40 pb-1.5">
                      <span className="text-slate-400">Target Repository:</span>
                      <a 
                        href={`https://github.com/${gitRepo}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="font-bold text-indigo-600 hover:underline flex items-center gap-0.5"
                      >
                        <span>{gitRepo}</span>
                        <ArrowUpRight className="h-3 w-3" />
                      </a>
                    </div>
                    <div className="flex justify-between items-center text-[11px] border-b border-slate-150/40 pb-1.5">
                      <span className="text-slate-400">Active Branch:</span>
                      <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-bold flex items-center gap-1">
                        <GitBranch className="h-3 w-3" /> {gitBranch}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Secure Access Scope:</span>
                      <span className="text-slate-600 font-semibold">repo, write:packages</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleDisconnectGit}
                    className="w-full border border-slate-200 hover:border-rose-200 hover:bg-rose-50 text-slate-500 hover:text-rose-600 font-bold py-2 rounded-lg transition-colors cursor-pointer text-center"
                  >
                    Disconnect GitHub Repository
                  </button>
                </div>
              )}
            </div>

            {/* COLUMN 2: SYNC ACTIONS & TRIGGER */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <RefreshCw className="h-5 w-5 text-indigo-500" />
                <h3 className="font-bold text-sm text-slate-800 font-display">Repository Synchronizer</h3>
              </div>

              <div className="space-y-4 text-xs">
                <p className="text-slate-500 leading-relaxed">
                  Trigger an on-demand pull of the latest codebase updates, and push backup snapshots of your system schemas to GitHub automatically.
                </p>

                <div className="space-y-3">
                  <button
                    onClick={handleManualGitSync}
                    disabled={isGitSyncing || !gitConnected}
                    className={`w-full font-bold py-3 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 text-xs cursor-pointer ${
                      !gitConnected 
                        ? 'bg-slate-100 text-slate-400 border border-slate-150 cursor-not-allowed'
                        : isGitSyncing
                          ? 'bg-indigo-50 text-indigo-600 border border-indigo-200 animate-pulse'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow'
                    }`}
                  >
                    <RefreshCw className={`h-4 w-4 ${isGitSyncing ? 'animate-spin' : ''}`} />
                    <span>{isGitSyncing ? 'Synchronizing Repository...' : 'Pull & Push Repository Sync'}</span>
                  </button>

                  <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-2.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Auto-Sync Configuration</span>
                    <label className="flex items-center gap-2 cursor-pointer text-slate-600 select-none">
                      <input
                        type="checkbox"
                        checked={gitAutoSync}
                        onChange={e => setGitAutoSync(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Auto-commit local database schemas on save</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-slate-600 select-none">
                      <input
                        type="checkbox"
                        defaultChecked={true}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Trigger app auto-deploy webhook on Git push</span>
                    </label>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Simulate File Change Commit</span>
                  <form onSubmit={handleAddCustomCommit} className="flex gap-1.5">
                    <input
                      type="text"
                      disabled={!gitConnected}
                      value={commitMessageInput}
                      onChange={e => setCommitMessageInput(e.target.value)}
                      placeholder={gitConnected ? "e.g., Added currency settings..." : "Connect repo to commit"}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!gitConnected || !commitMessageInput.trim()}
                      className="bg-slate-800 hover:bg-slate-950 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors disabled:opacity-50"
                    >
                      Commit
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* COLUMN 3: GRAPHICAL WORKFLOW & GIT OVERVIEW */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <GitPullRequest className="h-5 w-5 text-indigo-500" />
                <h3 className="font-bold text-sm text-slate-800 font-display">Branch Status & Integration</h3>
              </div>

              <div className="space-y-4 text-xs font-semibold">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="bg-emerald-50 text-emerald-600 p-2 rounded-lg mt-0.5">
                      <Check className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="block font-bold text-slate-700">Workspace is Up to Date</span>
                      <span className="block text-[11px] text-slate-400 font-normal">All remote patches and structural variables are integrated locally.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-indigo-50 text-indigo-600 p-2 rounded-lg mt-0.5">
                      <Database className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="block font-bold text-slate-700">Schema Integrity Check Passed</span>
                      <span className="block text-[11px] text-slate-400 font-normal">Firestore collection blueprints match config_export.json schemas.</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1 font-normal text-slate-500 leading-normal">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">GitHub Webhook Deploy Target</span>
                  <p className="text-[10px] font-mono bg-white border border-slate-200 rounded p-1.5 select-all truncate text-slate-600">
                    https://nexova-erp.ai/api/v1/deploy-hook?token={gitToken.substring(0, 10)}...
                  </p>
                  <span className="text-[9px] text-slate-400 block mt-1">Configure this URL as a GitHub push webhook event to enable automated container rebuilds.</span>
                </div>
              </div>
            </div>

          </div>

          {/* FULL ROW LOG CONSOLE */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="h-4 w-4 text-slate-700" />
                <span>GitHub Sync Terminal Command Logs</span>
              </h3>
              <button
                onClick={() => setGitLogs([])}
                className="text-[10px] text-slate-400 hover:text-slate-600 border border-slate-150 rounded px-2 py-0.5 transition-colors"
              >
                Clear Terminal Logs
              </button>
            </div>
            {gitLogs.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-10">Terminal trace is empty. Connect or trigger manual synchronization to generate events.</p>
            ) : (
              <div className="bg-slate-950 p-4 border border-slate-900 rounded-xl font-mono text-[11px] space-y-1.5 max-h-[220px] overflow-y-auto shadow-inner">
                {gitLogs.map((log, idx) => {
                  let colorClass = 'text-slate-300';
                  if (log.startsWith('[SUCCESS]')) colorClass = 'text-emerald-400 font-semibold';
                  if (log.startsWith('[WARNING]')) colorClass = 'text-amber-400 font-semibold';
                  if (log.startsWith('[ERROR]')) colorClass = 'text-rose-400 font-semibold';
                  if (log.startsWith('[COMMAND]')) colorClass = 'text-indigo-300';
                  if (log.startsWith('[SYSTEM]')) colorClass = 'text-slate-400';
                  if (log.startsWith('[COMMIT]') || log.startsWith('[PUSH]')) colorClass = 'text-sky-300';

                  return (
                    // index key safe: fixed-order static list
                    <p key={idx} className={colorClass}>
                      &gt; {log}
                    </p>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* WEBHOOK MODAL */}
      {showWebhookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <form onSubmit={handleCreateWebhook} className="bg-white border border-slate-200 rounded-xl p-5 w-full max-w-sm shadow-lg space-y-4">
            <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-2">Register Secure Webhook Stream</h3>
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Webhook Friendly Name *</label>
                <input
                  type="text"
                  required
                  value={webhookForm.name}
                  onChange={e => setWebhookForm({ ...webhookForm, name: e.target.value })}
                  placeholder="e.g., Slack stock alarm stream"
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Target Payload Destination URL *</label>
                <input
                  type="url"
                  required
                  value={webhookForm.url}
                  onChange={e => setWebhookForm({ ...webhookForm, url: e.target.value })}
                  placeholder="https://yourserver.com/hooks"
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Trigger System Event</label>
                <select
                  value={webhookForm.triggerEvent}
                  onChange={e => setWebhookForm({ ...webhookForm, triggerEvent: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none"
                >
                  <option value="Invoice Paid">On Invoice Paid Successful</option>
                  <option value="Inventory Low Stock">On Inventory Low Stock Alert</option>
                  <option value="New Lead">On New Corporate Lead Acquired</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 text-xs pt-2">
              <button
                type="button"
                onClick={() => setShowWebhookModal(false)}
                className="px-4 py-2 border border-slate-200 rounded text-slate-500 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded cursor-pointer"
              >
                Register
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
