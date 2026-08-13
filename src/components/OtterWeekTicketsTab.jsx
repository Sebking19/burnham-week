import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Download, Upload, Ticket, RefreshCw, Settings } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

const TICKET_TYPES = [
  { id: "senior_sailor", label: "Senior Sailor", price: 210 },
  { id: "non_sailing_senior", label: "Non-Sailing Senior", price: 200 },
  { id: "junior_sailor", label: "Junior Sailor", price: 200 },
  { id: "non_sailing_junior", label: "Non-Sailing Junior", price: 195 },
];

export default function OtterWeekTicketsTab({ user }) {
  const [tickets, setTickets] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isAdmin = user?.role === "admin" || user?.role === "owner";

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    const [t, c] = await Promise.all([
      base44.entities.OtterWeekTicket.list("-created_date", 200),
      base44.entities.OtterWeekConfig.list()
    ]);
    setTickets(t);
    if (c.length > 0) setConfig(c[0]);
    setLoading(false);
  };

  const toggleTicketsEnabled = async () => {
    setSaving(true);
    if (config) {
      const updated = await base44.entities.OtterWeekConfig.update(config.id, { tickets_enabled: !config.tickets_enabled });
      setConfig(updated);
    } else {
      const created = await base44.entities.OtterWeekConfig.create({ tickets_enabled: true });
      setConfig(created);
    }
    setSaving(false);
  };

  const exportCSV = () => {
    const rows = [
      ["Buyer Name", "Buyer Email", "Ticket Names", "Quantity", "Price Per Ticket", "Total Paid", "Paid", "Date"],
      ...tickets.map(t => [
        t.buyer_name || "",
        t.buyer_email || "",
        (t.ticket_names || []).join(" | "),
        t.quantity || 1,
        t.price_per_ticket ? `£${t.price_per_ticket.toFixed(2)}` : "",
        t.total_paid ? `£${t.total_paid.toFixed(2)}` : "",
        t.paid ? "Yes" : "No",
        t.created_date ? format(new Date(t.created_date), "dd/MM/yyyy HH:mm") : ""
      ])
    ];
    const csv = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `otter_week_tickets_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importCSV = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target.result;
      const lines = text.split("\n").slice(1).filter(l => l.trim());
      let imported = 0;
      for (const line of lines) {
        const cols = line.match(/(".*?"|[^,]+)(?=,|$)/g)?.map(c => c.replace(/^"|"$/g, "").replace(/""/g, '"')) || [];
        if (!cols[1]) continue;
        await base44.entities.OtterWeekTicket.create({
          buyer_name: cols[0] || "",
          buyer_email: cols[1],
          ticket_names: cols[2] ? cols[2].split(" | ") : [],
          quantity: parseInt(cols[3]) || 1,
          price_per_ticket: parseFloat(cols[4]?.replace("£", "")) || 0,
          total_paid: parseFloat(cols[5]?.replace("£", "")) || 0,
          paid: cols[6]?.toLowerCase() === "yes"
        });
        imported++;
      }
      alert(`Imported ${imported} ticket record${imported !== 1 ? "s" : ""}.`);
      loadAll();
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const paidTickets = tickets.filter(t => t.paid);
  const totalRevenue = paidTickets.reduce((sum, t) => sum + (t.total_paid || 0), 0);
  const totalPeople = paidTickets.reduce((sum, t) => sum + (t.quantity || 1), 0);

  if (loading) {
    return <p className="text-white/40 text-sm text-center py-12">Loading tickets...</p>;
  }

  return (
    <div className="space-y-5">
      {/* Config panel - admin only */}
      {isAdmin && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Settings size={14} className="text-white/50" />
            <span className="text-xs font-bold text-white/50 uppercase tracking-wide">Ticket Config</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-xs mb-1">
            {TICKET_TYPES.map(t => (
              <div key={t.id} className="flex justify-between text-white/40">
                <span>{t.label}</span><span className="font-bold text-white/60">£{t.price}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-sm">Sales open:</span>
            <button
              onClick={toggleTicketsEnabled}
              disabled={saving}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border disabled:opacity-50 ${config?.tickets_enabled ? "bg-green-500/20 text-green-300 border-green-500/30" : "bg-red-500/20 text-red-300 border-red-500/30"}`}
            >
              {config?.tickets_enabled ? "Open" : "Closed"}
            </button>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
          <p className="text-white font-bold text-xl">{tickets.length}</p>
          <p className="text-white/40 text-xs mt-0.5">Total Orders</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
          <p className="text-green-300 font-bold text-xl">{totalPeople}</p>
          <p className="text-white/40 text-xs mt-0.5">Paid People</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
          <p className="text-yellow-300 font-bold text-xl">£{totalRevenue.toFixed(0)}</p>
          <p className="text-white/40 text-xs mt-0.5">Revenue</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={exportCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30 transition-all"
        >
          <Download size={12} /> Export CSV
        </button>
        {isAdmin && (
          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 transition-all cursor-pointer">
            <Upload size={12} /> Import CSV
            <input type="file" accept=".csv" className="hidden" onChange={importCSV} />
          </label>
        )}
        <button
          onClick={loadAll}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 text-white/60 border border-white/10 hover:bg-white/20 transition-all"
        >
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Tickets list */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wide">All Ticket Orders</h3>
        {tickets.length === 0 && (
          <p className="text-white/25 text-sm text-center py-8">No tickets purchased yet</p>
        )}
        {tickets.map(ticket => (
          <motion.div
            key={ticket.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-white font-semibold text-sm">{ticket.buyer_name || ticket.buyer_email}</p>
                <p className="text-white/40 text-xs">{ticket.buyer_email}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${ticket.paid ? "bg-green-500/20 text-green-300 border-green-500/30" : "bg-orange-500/20 text-orange-300 border-orange-500/30"}`}>
                  {ticket.paid ? "Paid" : "Pending"}
                </span>
                <span className="text-white/60 text-xs font-bold">
                  {ticket.quantity} ticket{ticket.quantity > 1 ? "s" : ""} · £{ticket.total_paid?.toFixed(2)}
                </span>
              </div>
            </div>
            {(ticket.ticket_items?.length > 0 ? ticket.ticket_items : (ticket.ticket_names || []).map(n => ({ full_name: n, type: "" }))).map((item, i) => (
              <span key={i} className="text-[11px] bg-white/10 text-white/60 px-2 py-0.5 rounded-full border border-white/10">
                <Ticket size={9} className="inline mr-1" />{item.full_name}{item.type ? ` (${item.type})` : ""}
              </span>
            ))}
            {ticket.created_date && (
              <p className="text-white/25 text-[11px]">{format(new Date(ticket.created_date), "dd MMM yyyy, HH:mm")}</p>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}