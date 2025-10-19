
import React, { useEffect, useMemo, useState } from "react";
import { Invoice } from "@/api/entities";
import { createStripePaymentLink } from "@/api/functions"; // This import is kept, though its usage is removed
import { createGmailDraft } from "@/api/functions";
import { Button } from "@/components/ui/button";
import InvoiceForm from "@/components/invoices/InvoiceForm";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { createInvoiceCheckoutSession } from "@/api/functions";
import { Link as LinkIcon, ExternalLink, Copy, Check, Loader2, Mail, X } from "lucide-react";
// import { getGmailStatus } from "@/api/functions/getGmailStatus"; // TODO: Implement Gmail status function
import { sendTestEmail } from "@/api/functions/sendTestEmail";
import { Input } from "@/components/ui/input";
import { User } from "@/api/entities"; // NEW IMPORT


function toStripeItems(inv) {
  return (inv.items || []).map((it) => ({
    name: it.description || "Item",
    quantity: Number(it.quantity || 1),
    unit_amount_cents: Math.round(Number(it.unit_price || 0) * 100)
  }));
}

function defaultEmailHtml(inv, linkUrl) {
  const lines = (inv.items || []).map((it) => `<tr><td style="padding:6px 8px;border:1px solid #eee;">${it.description}</td><td style="padding:6px 8px;border:1px solid #eee;">${it.quantity}</td><td style="padding:6px 8px;border:1px solid #eee;">${Number(it.unit_price).toFixed(2)}</td></tr>`).join("");
  return `
  <div style="font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif">
    <p>Hi ${inv.customer_name || ""},</p>
    <p>Please review and pay your invoice using the secure link below.</p>
    <table style="border-collapse:collapse;margin:10px 0;">
      <thead><tr><th style="padding:6px 8px;border:1px solid #eee;text-align:left;">Description</th><th style="padding:6px 8px;border:1px solid #eee;text-align:left;">Qty</th><th style="padding:6px 8px;border:1px solid #eee;text-align:left;">Unit</th></tr></thead>
      <tbody>${lines}</tbody>
    </table>
    <p><a href="${linkUrl}" style="display:inline-block;background:#0ea5e9;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Pay Now</a></p>
    <p>Thank you!</p>
  </div>`;
}

export default function InvoiceBuilder() {
  const [__auth, set__auth] = React.useState({ loading: true, allowed: false, me: null });

  React.useEffect(() => {
    (async () => {
      try {
        const u = await User.me();
        const allowed = !!(u && u.is_superadmin === true);
        set__auth({ loading: false, allowed, me: u || null });
      } catch {
        set__auth({ loading: false, allowed: false, me: null });
      }
    })();
  }, []);

  // Render guards to avoid cryptic React errors if auth is undecided
  if (__auth.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        Checking access…
      </div>
    );
  }

  if (!__auth.allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white px-6 text-center">
        <div>
          <h2 className="text-xl font-semibold mb-2">Access restricted</h2>
          <p className="text-white/70">
            Invoices are available to the superadmin only. Please contact the app owner to grant access.
          </p>
        </div>
      </div>
    );
  }

  const [invoice, setInvoice] = useState({
    items: [{ description: "", quantity: 1, unit_price: 0 }],
    currency: "usd",
    discount_amount: 0,
    tax_rate_percent: 0,
    email_subject: "Your Invoice",
    email_body_html: ""
  });
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  // New state variables
  const [invoiceId, setInvoiceId] = useState(null);
  const [paymentLink, setPaymentLink] = useState(null);
  const [creatingLink, setCreatingLink] = useState(false);
  const [copied, setCopied] = useState(false);

  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailLoading, setGmailLoading] = useState(true);
  const [testEmail, setTestEmail] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [gmailMsg, setGmailMsg] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("invoiceId") || params.get("id");
    setInvoiceId(id);
    if (id) {
      Invoice.filter({ id }).then((rows) => {
        const inv = rows && rows[0];
        if (inv) {
          setInvoice(inv); // Update the invoice state with fetched data
          setPaymentLink(inv.stripe_payment_link_url || null);
        }
      });
    }
  }, []);

  useEffect(() => {
    const loadGmailStatus = async () => {
      // TODO: Implement Gmail status function
      setGmailLoading(true);
      setGmailConnected(false);
      setGmailMsg("Gmail integration temporarily disabled during migration.");
      setGmailLoading(false);
    };
    loadGmailStatus();
  }, []);

  const computeTotals = useMemo(() => {
    const subtotal = (invoice.items || []).reduce((sum, it) => sum + Number(it.quantity || 0) * Number(it.unit_price || 0), 0);
    const discount = Number(invoice.discount_amount || 0);
    const net = Math.max(0, subtotal - discount);
    const tax = Math.max(0, Math.round((Number(invoice.tax_rate_percent || 0) / 100) * net * 100) / 100);
    const total = Math.round((net + tax) * 100) / 100;
    return { subtotal, tax, total };
  }, [invoice]);

  const saveInvoice = async () => {
    setLoading(true);
    setMessage("");
    try {
      const payload = { ...invoice, ...computeTotals };
      let saved;
      if (invoice.id) {
        await Invoice.update(invoice.id, payload);
        saved = { ...invoice, ...payload };
      } else {
        saved = await Invoice.create(payload);
      }
      setInvoice(saved);
      setInvoiceId(saved.id); // Set invoiceId if a new invoice is saved
      setMessage("Invoice saved.");
    } catch (e) {
      setMessage("Failed to save invoice.");
    }
    setLoading(false);
  };

  const createDraft = async () => {
    setEmailing(true);
    setMessage("");
    try {
      const { data } = await createGmailDraft({
        to: invoice.customer_email,
        subject: invoice.email_subject || "Your Invoice",
        html: invoice.email_body_html || defaultEmailHtml(invoice, invoice.stripe_payment_link_url),
        sendNow: false
      });
      if (data?.success) setMessage("Gmail draft created.");
      else setMessage(data?.error || "Failed to create draft.");
    } catch (e) {
      setMessage("Gmail error. Check Gmail secrets.");
    }
    setEmailing(false);
  };

  const sendEmail = async () => {
    setEmailing(true);
    setMessage("");
    try {
      const { data } = await createGmailDraft({
        to: invoice.customer_email,
        subject: invoice.email_subject || "Your Invoice",
        html: invoice.email_body_html || defaultEmailHtml(invoice, invoice.stripe_payment_link_url),
        sendNow: true
      });
      if (data?.success) setMessage("Email sent.");
      else setMessage(data?.error || "Failed to send email.");
    } catch (e) {
      setMessage("Gmail error. Check Gmail secrets.");
    }
    setEmailing(false);
  };

  const addItem = () => setInvoice({ ...invoice, items: [...(invoice.items || []), { description: "", quantity: 1, unit_price: 0 }] });
  const addItemFromCatalog = (prefill) => {
    const next = { description: "", quantity: 1, unit_price: 0, ...(prefill || {}) };
    setInvoice({ ...invoice, items: [...(invoice.items || []), next] });
  };
  const removeItem = (idx) => {
    const items = [...(invoice.items || [])];
    items.splice(idx, 1);
    setInvoice({ ...invoice, items });
  };

  // Modified handleCreatePaymentLink to update invoice state and email body
  const handleCreatePaymentLink = async () => {
    if (!invoiceId || creatingLink) return;
    setCreatingLink(true);
    setMessage("");
    const origin = window.location.origin;
    const success_url = `${origin}${createPageUrl('InvoiceBuilder?invoiceId=' + encodeURIComponent(invoiceId) + '&paid=1')}`;
    const cancel_url = `${origin}${createPageUrl('InvoiceBuilder?invoiceId=' + encodeURIComponent(invoiceId) + '&canceled=1')}`;

    try {
      const { data } = await createInvoiceCheckoutSession({ invoice_id: invoiceId, success_url, cancel_url });
      if (data?.success && (data?.checkoutUrl || data?.url)) {
        const url = data.checkoutUrl || data.url;
        setPaymentLink(url);
        // keep local invoice in sync so email templates have the link immediately
        setInvoice((prev) => {
          const updated = { ...prev, stripe_payment_link_url: url, stripe_payment_link_id: data.id, status: prev?.status || 'sent' };
          if (!updated.email_body_html) {
            updated.email_body_html = defaultEmailHtml(updated, url);
          }
          return updated;
        });
        setMessage("Stripe checkout link created successfully.");
      } else {
        setMessage(data?.error || "Failed to create Stripe checkout link.");
      }
    } catch (e) {
      setMessage("Error creating Stripe checkout link. Check server logs.");
    }
    setCreatingLink(false);
  };

  const handleCopy = async () => {
    if (!paymentLink) return;
    await navigator.clipboard.writeText(paymentLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const handleSendTestEmail = async () => {
    setSendingTest(true);
    setGmailMsg("");
    const to = (testEmail || invoice?.customer_email || "").trim();
    const { data } = await sendTestEmail({ to: to || undefined });
    if (data?.success) {
      setGmailMsg(`Test email sent to ${data?.to || to || "recipient"}.`);
    } else {
      setGmailMsg(data?.error || "Failed to send test email.");
    }
    setSendingTest(false);
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto space-y-4 px-6 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Invoice Builder</h1>
        </div>

        {message && <div className="p-3 rounded border bg-white">{message}</div>}

        {/* Email connection panel */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-white/80" />
              <span className="font-medium text-white">Email connection</span>
              {gmailLoading ? (
                <span className="inline-flex items-center gap-1 text-white/60 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" /> Checking…
                </span>
              ) : gmailConnected ? (
                <span className="inline-flex items-center gap-1 text-emerald-400 text-sm">
                  <Check className="w-4 h-4" /> Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-amber-400 text-sm">
                  <X className="w-4 h-4" /> Not connected
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder={invoice?.customer_email ? `Send to ${invoice.customer_email}` : "Test email address"}
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="w-64 bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
              <Button
                onClick={handleSendTestEmail}
                disabled={sendingTest || gmailLoading}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {sendingTest ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending</> : "Send test email"}
              </Button>
            </div>
          </div>
          {gmailMsg && <p className="mt-2 text-white/70 text-sm">{gmailMsg}</p>}
        </div>

        {/* New Payment Link UI Section */}
        <div> {/* Removed my-4 as parent space-y handles spacing */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-white/80" />
                <span className="text-white">Payment link</span>
              </div>

              {paymentLink ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={handleCopy}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                  <a
                    href={paymentLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open
                  </a>
                </div>
              ) : (
                <Button
                  onClick={handleCreatePaymentLink}
                  disabled={!invoiceId || creatingLink}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {creatingLink ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating…
                    </>
                  ) : (
                    "Create Stripe Payment Link"
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <InvoiceForm
            invoice={invoice}
            onChange={setInvoice}
            onAddItem={addItem}
            onAddFromCatalog={addItemFromCatalog}
            onRemoveItem={removeItem}
            onGenerateLink={handleCreatePaymentLink}
            onSave={saveInvoice}
            onCreateDraft={createDraft}
            onSendEmail={sendEmail}
            generating={generating}
            saving={loading}
            emailing={emailing}
          />
        </div>
      </div>
    </div>
  );
}
