import { useEffect, useState } from 'react';
import { History, ShieldAlert, CheckCircle } from 'lucide-react';
import { fetchAuditLogs, type AuditLog } from '../../lib/api';

export function AuditLogPanel() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuditLogs()
      .then((data) => {
        setLogs(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const formatTime = (timeStr: string) => {
    try {
      const d = new Date(timeStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' ' + d.toLocaleDateString();
    } catch (e) {
      return timeStr;
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-6 bg-transparent z-10">
      <div className="border-b border-white/5 pb-4 bg-[#0a0c18]/25 backdrop-blur-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide">Audit Trail Log</h1>
          <p className="text-xs text-gray-400 mt-1">Immutable ledger recording every orchestrator classification, agent response, and founder approval.</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-white/5 border border-white/5 rounded-lg px-3 py-1.5 font-medium">
          <History size={14} />
          Read-only Ledger
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Loading audit trail ledger records...
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden flex flex-col min-h-0 flex-1">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs text-gray-400">
              <thead className="bg-[#0b0c16]/55 border-b border-white/5 text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                <tr>
                  <th className="p-4 w-40">Timestamp</th>
                  <th className="p-4 w-28">Agent</th>
                  <th className="p-4 w-32">Action</th>
                  <th className="p-4 w-52">Input Parameter</th>
                  <th className="p-4">Output Result</th>
                  <th className="p-4 w-20 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-transparent font-medium">
                {logs.map((log) => {
                  const isSuccess = log.status === 'success';
                  return (
                    <tr key={log.log_id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 whitespace-nowrap text-gray-500">{formatTime(log.timestamp)}</td>
                      <td className="p-4 whitespace-nowrap">
                        <span className="text-gray-300 font-bold">{log.agent}</span>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className="text-gray-400">{log.action}</span>
                      </td>
                      <td className="p-4 max-w-xs truncate text-gray-400" title={log.input || ''}>
                        {log.input || '-'}
                      </td>
                      <td className="p-4 max-w-sm truncate text-gray-300" title={log.output || ''}>
                        {log.output || '-'}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center">
                          {isSuccess ? (
                            <span title="Success"><CheckCircle size={14} className="text-emerald-400" /></span>
                          ) : (
                            <span title="Warning"><ShieldAlert size={14} className="text-rose-400" /></span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {logs.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-gray-600 gap-2">
              <History className="w-8 h-8 text-gray-700" />
              <p className="text-[13px] font-semibold">No audit logs logged in database.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
