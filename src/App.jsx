import { useState, useMemo } from 'react';

const PRODUCTS = [
  { id: 1, name: 'Smartphone X', price: 899, icon: '📱' },
  { id: 2, name: 'Smartwatch Pro', price: 249, icon: '⌚' },
  { id: 3, name: 'Fast Charger 65W', price: 39, icon: '🔌' },
  { id: 4, name: 'Premium Phone Case', price: 29, icon: '🛡️' },
  { id: 5, name: 'Wireless Earbuds', price: 149, icon: '🎧' },
  { id: 6, name: 'Pro Laptop 14"', price: 1299, icon: '💻' }
];

function App() {
  const [cart, setCart] = useState([]);

  const addToCart = (product) => {
    if (!cart.find((item) => item.id === product.id)) {
      setCart([...cart, product]);
    }
  };

  const removeFromCart = (id) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  // Intelligence Engine calculates everything on the fly
  const { recommendations, discount, subtotal, total } = useMemo(() => {
    let subtotal = 0;
    cart.forEach(item => subtotal += item.price);

    let recommendations = [];
    let discount = { amount: 0, reason: null };

    const cartIds = cart.map(item => item.id);
    const hasPhone = cartIds.includes(1);
    const hasWatch = cartIds.includes(2);
    const hasCharger = cartIds.includes(3);
    const hasCase = cartIds.includes(4);
    const hasEarbuds = cartIds.includes(5);
    const hasLaptop = cartIds.includes(6);

    // Rule 1: Phone without case -> Suggest Case
    if (hasPhone && !hasCase) {
      recommendations.push({
        product: PRODUCTS.find(p => p.id === 4),
        tag: 'Protect Your Investment'
      });
    }

    // Rule 2: Phone without earbuds -> Suggest Earbuds
    if (hasPhone && !hasEarbuds) {
      recommendations.push({
        product: PRODUCTS.find(p => p.id === 5),
        tag: 'Perfect Companion'
      });
    }

    // Rule 3: Laptop without charger -> Suggest extra charger
    if (hasLaptop && !hasCharger) {
      recommendations.push({
        product: PRODUCTS.find(p => p.id === 3),
        tag: 'Never Run Out Of Battery'
      });
    }

    // Bundle Logic (Discount)
    if (hasPhone && hasCase && hasEarbuds) {
      discount.amount = 50;
      discount.reason = "Ultimate Tech Bundle Applied! (-$50)";
    } else if (subtotal > 1000) {
      discount.amount = subtotal * 0.10; // 10% off
      discount.reason = "High Roller Discount! 10% Off";
    } else if (hasPhone && hasCase) {
      discount.amount = 15;
      discount.reason = "Phone + Case Bundle! (-$15)";
    }

    let total = subtotal - discount.amount;

    // Return max 2 recommendations
    return { 
      recommendations: recommendations.slice(0, 2), 
      discount, 
      subtotal, 
      total 
    };
  }, [cart]);

  return (
    <div className="app-container">
      <header>
        <div className="logo">✨ ShopGenie</div>
        <div>Intelligent Retail Assistant</div>
      </header>

      <div className="main-content">
        {/* Products Catalog */}
        <section className="glass-panel">
          <h2 className="section-title">🛍️ Explore Electronics</h2>
          <div className="products-grid">
            {PRODUCTS.map(product => (
              <div key={product.id} className="product-card">
                <div className="product-icon-wrap">
                  {product.icon}
                </div>
                <div className="product-info">
                  <h3>{product.name}</h3>
                  <p>In Stock</p>
                  <div className="product-price">${product.price.toFixed(2)}</div>
                </div>
                <button 
                  className={`btn ${cart.find(i => i.id === product.id) ? '' : 'btn-primary'}`}
                  onClick={() => addToCart(product)}
                  disabled={cart.find(i => i.id === product.id)}
                >
                  {cart.find(i => i.id === product.id) ? 'Added to Cart' : 'Add to Cart'}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Smart Cart UI */}
        <section className="glass-panel">
          <h2 className="section-title">🛒 Smart Cart</h2>
          
          {cart.length === 0 ? (
            <div className="empty-cart">
              Your cart is empty. Try adding some items to see ShopGenie in action!
            </div>
          ) : (
            <div className="cart-list">
              {cart.map(item => (
                <div key={item.id} className="cart-item">
                  <div className="cart-item-info">
                    <div className="cart-item-title">{item.icon} {item.name}</div>
                    <div className="cart-item-price">${item.price.toFixed(2)}</div>
                  </div>
                  <button className="cart-remove" onClick={() => removeFromCart(item.id)}>×</button>
                </div>
              ))}
            </div>
          )}

          {/* Checkout Totals */}
          {cart.length > 0 && (
            <div className="cart-totals">
              <div className="total-row">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              
              {discount.amount > 0 && (
                <div className="discount-alert">
                  <strong>✨ {discount.reason}</strong>
                  <span style={{marginLeft: 'auto'}}>-${discount.amount.toFixed(2)}</span>
                </div>
              )}

              <div className="total-row final">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
              
              <button className="btn btn-primary" style={{marginTop: '1.5rem', width: '100%', padding: '1rem', fontSize: '1.1rem'}}>
                Secure Checkout
              </button>
            </div>
          )}

          {/* Recommendations Engine Output */}
          {recommendations.length > 0 && (
            <div className="recommendations-panel glass-panel" style={{marginTop: '2rem'}}>
              <div className="ai-badge">AI Recommendation</div>
              <h3 style={{marginBottom: '1rem', fontSize: '1.1rem'}}>Frequently Bought Together</h3>
              
              {recommendations.map((rec, index) => (
                <div key={index} className="recommendation-card">
                  <div className="product-icon-wrap">{rec.product.icon}</div>
                  <div className="recommendation-info">
                    <div className="recommendation-tag">{rec.tag}</div>
                    <div style={{fontWeight: 600, margin: '0.25rem 0'}}>{rec.product.name}</div>
                    <div style={{color: 'var(--accent-color)'}}>${rec.product.price.toFixed(2)}</div>
                  </div>
                  <button className="btn btn-primary" style={{width: 'auto'}} onClick={() => addToCart(rec.product)}>+</button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default App;
