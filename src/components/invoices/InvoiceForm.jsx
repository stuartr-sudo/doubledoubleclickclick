
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import AddItemFromCatalog from "./AddItemFromCatalog"; // Changed from "./AddItemFromCatalog.jsx"

export default function InvoiceForm({ invoice, onChange, onAddItem, onRemoveItem, onGenerateLink, onSave, onCreateDraft, onSendEmail, generating, saving, emailing, sendMode = "draft", onAddFromCatalog }) {
  const currencies = ["usd", "eur", "gbp", "cad", "aud"];

  const handleChange = (key, val) => onChange({ ...invoice, [key]: val });

  const computeTotals = (inv) => {
    const subtotal = (inv.items || []).reduce((sum, it) => sum + Number(it.quantity || 0) * Number(it.unit_price || 0), 0);
    const discount = Number(inv.discount_amount || 0);
    const net = Math.max(0, subtotal - discount);
    const tax = Math.max(0, Math.round((Number(inv.tax_rate_percent || 0) / 100) * net * 100) / 100);
    const total = Math.round((net + tax) * 100) / 100;
    return { subtotal, tax, total };
  };

  const { subtotal, tax, total } = computeTotals(invoice);

  return (
    <div className="space-y-6">
      {/* New: Add from services */}
      <AddItemFromCatalog onAdd={(prefill) => {
        if (onAddFromCatalog) {
          onAddFromCatalog(prefill);
        } else if (onAddItem) {
          // fallback: use onAddItem if parent didn't pass a dedicated handler
          onAddItem(prefill);
        }
      }} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input placeholder="Invoice Number (optional)" value={invoice.invoice_number || ""} onChange={(e) => handleChange("invoice_number", e.target.value)} />
        <Input placeholder="Customer Name" value={invoice.customer_name || ""} onChange={(e) => handleChange("customer_name", e.target.value)} />
        <Input placeholder="Customer Email" value={invoice.customer_email || ""} onChange={(e) => handleChange("customer_email", e.target.value)} />
        <Select value={invoice.currency || "usd"} onValueChange={(v) => handleChange("currency", v)}>
          <SelectTrigger><SelectValue placeholder="Currency" /></SelectTrigger>
          <SelectContent>{currencies.map(c => <SelectItem key={c} value={c}>{c.toUpperCase()}</SelectItem>)}</SelectContent>
        </Select>
        <Input type="date" value={invoice.due_date || ""} onChange={(e) => handleChange("due_date", e.target.value)} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Items</h3>
          <Button variant="outline" size="sm" onClick={onAddItem}><Plus className="w-4 h-4 mr-1" /> Add Item</Button>
        </div>
        <div className="space-y-3">
          {(invoice.items || []).map((it, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-6">
                <Input placeholder="Description" value={it.description || ""} onChange={(e) => {
                  const items = [...(invoice.items || [])];
                  items[idx] = { ...items[idx], description: e.target.value };
                  onChange({ ...invoice, items });
                }} />
              </div>
              <div className="col-span-2">
                <Input type="number" step="1" min="1" placeholder="Qty" value={it.quantity ?? 1} onChange={(e) => {
                  const items = [...(invoice.items || [])];
                  items[idx] = { ...items[idx], quantity: Number(e.target.value || 0) };
                  onChange({ ...invoice, items });
                }} />
              </div>
              <div className="col-span-3">
                <Input type="number" step="0.01" min="0" placeholder="Unit Price" value={it.unit_price ?? 0} onChange={(e) => {
                  const items = [...(invoice.items || [])];
                  items[idx] = { ...items[idx], unit_price: Number(e.target.value || 0) };
                  onChange({ ...invoice, items });
                }} />
              </div>
              <div className="col-span-1 flex justify-end">
                <Button variant="ghost" size="icon" onClick={() => onRemoveItem(idx)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input type="number" step="0.01" min="0" placeholder="Discount amount" value={invoice.discount_amount ?? 0} onChange={(e) => handleChange("discount_amount", Number(e.target.value || 0))} />
        <Input type="number" step="0.01" min="0" placeholder="Tax rate %" value={invoice.tax_rate_percent ?? 0} onChange={(e) => handleChange("tax_rate_percent", Number(e.target.value || 0))} />
        <Input readOnly value={`Subtotal: ${subtotal.toFixed(2)} • Tax: ${tax.toFixed(2)} • Total: ${total.toFixed(2)}`} />
      </div>

      <Textarea rows={3} placeholder="Notes (shown on invoice)" value={invoice.notes || ""} onChange={(e) => handleChange("notes", e.target.value)} />

      <div className="space-y-2">
        <Input placeholder="Email Subject" value={invoice.email_subject || ""} onChange={(e) => handleChange("email_subject", e.target.value)} />
        <Textarea rows={6} placeholder="Email Body (HTML)" value={invoice.email_body_html || ""} onChange={(e) => handleChange("email_body_html", e.target.value)} />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={onSave} disabled={saving}>{saving ? "Saving..." : "Save Invoice"}</Button>
        <Button variant="outline" onClick={onGenerateLink} disabled={generating}>{generating ? "Generating..." : "Create Payment Link"}</Button>
        <Button variant="outline" onClick={onCreateDraft} disabled={emailing || !invoice.stripe_payment_link_url}>{emailing ? "Working..." : "Create Gmail Draft"}</Button>
        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={onSendEmail} disabled={emailing || !invoice.stripe_payment_link_url}>{emailing ? "Working..." : "Send Email"}</Button>
      </div>

      {invoice.stripe_payment_link_url && (
        <div className="p-3 bg-green-50 border rounded">
          Payment Link: <a className="text-blue-600 underline break-all" href={invoice.stripe_payment_link_url} target="_blank" rel="noreferrer">{invoice.stripe_payment_link_url}</a>
        </div>
      )}
    </div>
  );
}
