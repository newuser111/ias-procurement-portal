"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Vendor { id: string; name: string; code: string; }
interface Location { id: string; name: string; code: string; }
interface Product { id: string; name: string; unitPrice: number; unitOfMeasure: string; vendor: { id: string }; }

interface LineItem {
  productId: string | null;
  name: string;
  quantity: number;
  unitPrice: number;
}

export default function NewOrderPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [vendorId, setVendorId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [priority, setPriority] = useState("NORMAL");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([{ productId: null, name: "", quantity: 1, unitPrice: 0 }]);

  useEffect(() => {
    Promise.all([
      fetch("/api/catalog").then((r) => r.json()),
      fetch("/api/admin/locations").then((r) => r.json()),
    ]).then(([catalogData, locs]) => {
      setVendors(catalogData.vendors || []);
      setProducts(catalogData.products || []);
      setLocations(locs || []);
      // Default to user's location
      if (session?.user?.locationId) setLocationId(session.user.locationId);
    }).finally(() => setLoading(false));
  }, [session]);

  const vendorProducts = products.filter((p) => p.vendor.id === vendorId);

  function addItem() {
    setItems([...items, { productId: null, name: "", quantity: 1, unitPrice: 0 }]);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: string, value: string | number) {
    const updated = [...items];
    (updated[index] as unknown as Record<string, unknown>)[field] = value;

    // Auto-fill from product catalog
    if (field === "productId" && value) {
      const product = products.find((p) => p.id === value);
      if (product) {
        updated[index].name = product.name;
        updated[index].unitPrice = product.unitPrice;
      }
    }

    setItems(updated);
  }

  const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  async function handleSubmit(submit: boolean) {
    if (!vendorId || !locationId || items.length === 0) return;

    const validItems = items.filter((item) => item.name && item.quantity > 0);
    if (validItems.length === 0) return;

    setSubmitting(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vendorId, locationId, priority, notes, items: validItems, submit }),
    });

    if (res.ok) {
      const order = await res.json();
      router.push(`/orders/${order.id}`);
    }
    setSubmitting(false);
  }

  if (loading) return <div className="text-center text-ias-gray-400 py-12">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ias-charcoal">New Purchase Order</h1>
        <p className="text-ias-gray-500 text-sm mt-1">Create a new purchase request</p>
      </div>

      {/* Order Details */}
      <div className="bg-white rounded-xl shadow-sm border border-ias-gray-200 p-5 space-y-4">
        <h2 className="font-semibold text-ias-charcoal">Order Details</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ias-gray-700 mb-1">Vendor *</label>
            <select
              value={vendorId}
              onChange={(e) => { setVendorId(e.target.value); setItems([{ productId: null, name: "", quantity: 1, unitPrice: 0 }]); }}
              className="w-full px-3 py-2 border border-ias-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ias-gold"
            >
              <option value="">Select vendor...</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ias-gray-700 mb-1">Location *</label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="w-full px-3 py-2 border border-ias-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ias-gold"
            >
              <option value="">Select location...</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ias-gray-700 mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2 border border-ias-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ias-gold"
            >
              <option value="LOW">Low</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ias-gray-700 mb-1">Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
              className="w-full px-3 py-2 border border-ias-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ias-gold"
            />
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-white rounded-xl shadow-sm border border-ias-gray-200 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-ias-charcoal">Line Items</h2>
          <button
            onClick={addItem}
            className="text-sm text-ias-blue hover:underline font-medium"
          >
            + Add Item
          </button>
        </div>

        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="flex flex-col sm:flex-row gap-2 p-3 bg-ias-gray-50 rounded-lg">
              {/* Product Select or Custom Name */}
              <div className="flex-1">
                {vendorId && vendorProducts.length > 0 ? (
                  <select
                    value={item.productId || ""}
                    onChange={(e) => updateItem(index, "productId", e.target.value)}
                    className="w-full px-3 py-2 border border-ias-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ias-gold"
                  >
                    <option value="">Select product or type custom...</option>
                    {vendorProducts.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} — ${p.unitPrice}/{p.unitOfMeasure}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateItem(index, "name", e.target.value)}
                    placeholder="Item name"
                    className="w-full px-3 py-2 border border-ias-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ias-gold"
                  />
                )}
                {!item.productId && vendorId && vendorProducts.length > 0 && (
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateItem(index, "name", e.target.value)}
                    placeholder="Or type custom item name..."
                    className="w-full mt-1 px-3 py-2 border border-ias-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ias-gold"
                  />
                )}
              </div>

              <div className="w-20">
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                  placeholder="Qty"
                  className="w-full px-3 py-2 border border-ias-gray-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-ias-gold"
                />
              </div>

              <div className="w-28">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unitPrice}
                  onChange={(e) => updateItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                  placeholder="Price"
                  className="w-full px-3 py-2 border border-ias-gray-300 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-ias-gold"
                />
              </div>

              <div className="w-24 flex items-center justify-between">
                <span className="text-sm font-medium">${(item.quantity * item.unitPrice).toFixed(2)}</span>
                {items.length > 1 && (
                  <button onClick={() => removeItem(index)} className="text-ias-danger hover:text-red-700 ml-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="flex justify-end pt-3 border-t border-ias-gray-200">
          <div className="text-right">
            <div className="text-sm text-ias-gray-500">Order Total</div>
            <div className="text-2xl font-bold text-ias-charcoal">${totalAmount.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-3 justify-end">
        <button
          onClick={() => handleSubmit(false)}
          disabled={submitting || !vendorId || !locationId}
          className="px-5 py-2.5 border border-ias-gray-300 text-ias-gray-700 rounded-lg text-sm font-medium hover:bg-ias-gray-50 disabled:opacity-50"
        >
          Save as Draft
        </button>
        <button
          onClick={() => handleSubmit(true)}
          disabled={submitting || !vendorId || !locationId}
          className="px-5 py-2.5 bg-ias-charcoal text-white rounded-lg text-sm font-medium hover:bg-ias-charcoal-light disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Submit for Approval"}
        </button>
      </div>
    </div>
  );
}
