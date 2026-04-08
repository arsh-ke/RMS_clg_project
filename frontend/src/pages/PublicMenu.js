import React, { useEffect, useState } from 'react';
import { ShoppingCart, AlertCircle, Loader2 } from 'lucide-react';

function useQuery() {
  return new URLSearchParams(window.location.search);
}

const PublicMenu = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState({});
  const [placingOrder, setPlacingOrder] = useState(false);
  const q = useQuery();
  const tableId = q.get('table');

  useEffect(() => {
    const fetchMenu = async () => {
      const apiUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      try {
        const response = await fetch(`${apiUrl}/api/menu/public`);
        const text = await response.text();
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${text.substring(0, 100)}`);
        }
        
        try {
          const data = JSON.parse(text);
          if (data && data.data) {
            setItems(data.data);
          }
          setError(null);
        } catch (parseErr) {
          throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`);
        }
      } catch (err) {
        console.error('Menu fetch error:', err);
        setError(err.message);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  const add = (item) => {
    setCart((c) => {
      const copy = { ...c };
      const key = item.id || item._id;
      copy[key] = (copy[key] || 0) + 1;
      return copy;
    });
  };

  const remove = (item) => {
    setCart((c) => {
      const copy = { ...c };
      const key = item.id || item._id;
      if (!copy[key]) return copy;
      copy[key] = copy[key] - 1;
      if (copy[key] <= 0) delete copy[key];
      return copy;
    });
  };

  const placeOrder = async () => {
    if (!tableId) {
      alert('Error: Table not specified. Please scan a valid QR code.');
      return;
    }
    
    const payloadItems = Object.keys(cart).map((id) => ({ 
      menuItemId: id, 
      quantity: cart[id] 
    }));
    
    if (payloadItems.length === 0) {
      alert('Please add at least one item to your order');
      return;
    }

    const apiUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
    setPlacingOrder(true);
    try {
      const resp = await fetch(`${apiUrl}/api/qr/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tableId, 
          items: payloadItems,
          customerName: 'Guest',
          customerPhone: ''
        })
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.message || 'Order failed');
      }
      alert(`✓ Order placed successfully\nOrder #: ${data.data.orderNumber}`);
      setCart({});
    } catch (err) {
      console.error('Order error:', err);
      alert(`❌ Failed to place order: ${err.message}`);
    } finally {
      setPlacingOrder(false);
    }
  };

  const total = items.reduce((sum, it) => {
    const key = it.id || it._id;
    const qty = cart[key] || 0;
    return sum + qty * (it.price || 0);
  }, 0);

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">🍽️ Our Menu</h1>
          {tableId ? (
            <p className="text-orange-400 font-semibold">Table #{tableId}</p>
          ) : (
            <div className="flex items-center gap-2 text-red-500 bg-red-500/10 p-3 rounded border border-red-500/20">
              <AlertCircle className="h-5 w-5" />
              <span>⚠️ No table specified. Please scan a valid QR code.</span>
            </div>
          )}
        </div>

        {loading && (
          <div className="flex justify-center items-center py-16">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-orange-500 mx-auto mb-4" />
              <p className="text-zinc-400">Loading menu items...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 p-4 rounded mb-6 text-red-400">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!loading && items.length === 0 && !error && (
          <div className="text-center py-16">
            <AlertCircle className="h-16 w-16 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400">No menu items available</p>
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Menu Items */}
            <div className="lg:col-span-2 space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-orange-500/50 transition-all"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{item.name}</h3>
                        {!item.isAvailable && (
                          <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">
                            Unavailable
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-zinc-400 mt-1">{item.description || 'No description'}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-sm text-zinc-500 capitalize bg-zinc-800 px-2 py-1 rounded">
                          {item.category}
                        </span>
                        <span className="text-xs text-zinc-500">⏱️ {item.preparationTime} min</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold text-orange-500 mb-2">₹{item.price}</div>
                      {item.isAvailable && (
                        <div className="flex items-center gap-2 bg-zinc-800 rounded p-1">
                          <button
                            onClick={() => remove(item)}
                            disabled={!cart[item.id]}
                            className="w-8 h-8 flex items-center justify-center rounded bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed text-white"
                          >
                            −
                          </button>
                          <span className="w-8 text-center font-semibold">{cart[item.id] || 0}</span>
                          <button
                            onClick={() => add(item)}
                            className="w-8 h-8 flex items-center justify-center rounded bg-orange-600 hover:bg-orange-500 text-white"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart Summary */}
            <div className="lg:col-span-1">
              <div className="bg-zinc-900 border border-orange-500/30 rounded-lg p-6 sticky top-4">
                <div className="flex items-center gap-2 mb-4">
                  <ShoppingCart className="h-5 w-5 text-orange-500" />
                  <h3 className="font-bold text-lg">Your Order</h3>
                </div>

                {Object.keys(cart).length === 0 ? (
                  <p className="text-zinc-500 text-center py-8">No items selected</p>
                ) : (
                  <div className="space-y-1">
                    {Object.keys(cart).map((id) => {
                      const item = items.find((x) => x.id === id);
                      if (!item) return null;
                      const itemTotal = item.price * cart[id];
                      return (
                        <div
                          key={id}
                          className="flex justify-between text-sm pb-1 border-b border-zinc-800"
                        >
                          <span className="text-zinc-300">
                            {item.name} <span className="text-zinc-500">×{cart[id]}</span>
                          </span>
                          <span className="font-semibold">₹{itemTotal.toFixed(2)}</span>
                        </div>
                      );
                    })}

                    <div className="pt-3 border-t border-zinc-700 mt-3">
                      <div className="flex justify-between mb-3">
                        <span className="text-zinc-400">Subtotal</span>
                        <span>₹{total.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between mb-4">
                        <span className="text-zinc-400">Tax (5%)</span>
                        <span>₹{(total * 0.05).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg text-orange-400 mb-4">
                        <span>Total</span>
                        <span>₹{(total * 1.05).toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-4">
                      <button
                        onClick={placeOrder}
                        disabled={!tableId || placingOrder}
                        className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        {placingOrder ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Placing...
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="h-4 w-4" />
                            Place Order
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setCart({})}
                        className="w-full border border-zinc-700 hover:border-zinc-600 text-white py-2 rounded-lg transition-colors"
                      >
                        Clear Cart
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicMenu;
