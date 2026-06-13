const { sendEmail } = require("./emailUtils");

// ════════════════════════════════════════════════════════
// Order Confirmation (Customer)
// ════════════════════════════════════════════════════════
const sendOrderConfirmationEmail = async (order, customer) => {
  const itemRows = order.items.map((item) => `
    <tr>
      <td style="padding:10px;border-bottom:1px solid #e2e8f0">
        <strong>${item.name}</strong>
        ${item.variant?.label ? `<br><small style="color:#718096">${item.variant.name}: ${item.variant.label}</small>` : ""}
      </td>
      <td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:center">${item.quantity}</td>
      <td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:right">৳${(item.price * item.quantity).toLocaleString()}</td>
    </tr>`).join("");

  const html = `
    <!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>
      body{font-family:'Segoe UI',sans-serif;background:#f4f4f4;margin:0;padding:0}
      .wrap{max-width:620px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)}
      .hdr{background:linear-gradient(135deg,#1a1a2e,#16213e);padding:36px 30px;text-align:center}
      .hdr h1{color:#fff;margin:0;font-size:24px} .hdr p{color:#a0aec0;margin:6px 0 0;font-size:14px}
      .body{padding:36px 30px}
      .badge{background:#ebf8ff;color:#2b6cb0;padding:6px 14px;border-radius:20px;font-size:13px;font-weight:600;display:inline-block}
      table{width:100%;border-collapse:collapse;margin:20px 0}
      th{background:#f7fafc;padding:10px;text-align:left;font-size:13px;color:#718096;border-bottom:2px solid #e2e8f0}
      .summary{background:#f7fafc;border-radius:8px;padding:16px 20px;margin:20px 0}
      .summary-row{display:flex;justify-content:space-between;padding:4px 0;font-size:14px;color:#4a5568}
      .summary-total{font-weight:700;font-size:16px;color:#1a1a2e;border-top:1px solid #e2e8f0;margin-top:8px;padding-top:8px}
      .addr{background:#f7fafc;border-radius:8px;padding:16px 20px;font-size:14px;color:#4a5568;line-height:1.7}
      .btn{display:inline-block;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff!important;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px}
      .footer{background:#f7fafc;padding:20px;text-align:center}
      .footer p{color:#a0aec0;font-size:12px;margin:0}
    </style></head><body>
    <div class="wrap">
      <div class="hdr">
        <h1> Order Confirmed!</h1>
        <p>Thank you for your purchase</p>
      </div>
      <div class="body">
        <p style="color:#4a5568">Hi <strong>${customer.name}</strong>,</p>
        <p style="color:#4a5568">Your order has been placed successfully.</p>
        <p><span class="badge">Order # ${order.orderNumber}</span></p>

        <table>
          <thead><tr>
            <th>Product</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th>
          </tr></thead>
          <tbody>${itemRows}</tbody>
        </table>

        <div class="summary">
          <div class="summary-row"><span>Subtotal</span><span>৳${order.pricing.subtotal.toLocaleString()}</span></div>
          <div class="summary-row"><span>Shipping</span><span>৳${order.pricing.shippingCharge.toLocaleString()}</span></div>
          ${order.pricing.discount > 0 ? `<div class="summary-row"><span>Discount</span><span style="color:#38a169">-৳${order.pricing.discount.toLocaleString()}</span></div>` : ""}
          <div class="summary-row summary-total"><span>Total</span><span>৳${order.pricing.total.toLocaleString()}</span></div>
        </div>

        <p style="font-weight:600;color:#2d3748;margin:20px 0 8px">📦 Shipping To:</p>
        <div class="addr">
          ${order.shippingAddress.fullName}<br>
          ${order.shippingAddress.address}, ${order.shippingAddress.city}<br>
          ${order.shippingAddress.district} ${order.shippingAddress.postalCode}<br>
           ${order.shippingAddress.phone}
        </div>

        <div style="text-align:center;margin-top:24px">
          <a href="${process.env.CLIENT_URL}/orders/${order._id}" class="btn">Track My Order →</a>
        </div>
      </div>
      <div class="footer"><p>© ${new Date().getFullYear()} MultiVendor. All rights reserved.</p></div>
    </div></body></html>`;

  await sendEmail({ to: customer.email, subject: `Order Confirmed #${order.orderNumber} — MultiVendor`, html });
};

// ════════════════════════════════════════════════════════
// New Order Notification (Vendor)
// ════════════════════════════════════════════════════════
const sendVendorNewOrderEmail = async (vendor, order, vendorItems) => {
  const itemRows = vendorItems.map((item) => `
    <tr>
      <td style="padding:10px;border-bottom:1px solid #e2e8f0"><strong>${item.name}</strong></td>
      <td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:center">${item.quantity}</td>
      <td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:right">৳${(item.price * item.quantity).toLocaleString()}</td>
      <td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:right;color:#38a169">৳${item.vendorEarning.toLocaleString()}</td>
    </tr>`).join("");

  const totalEarning = vendorItems.reduce((sum, i) => sum + i.vendorEarning, 0);

  const html = `
    <!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>
      body{font-family:'Segoe UI',sans-serif;background:#f4f4f4;margin:0;padding:0}
      .wrap{max-width:620px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)}
      .hdr{background:linear-gradient(135deg,#276749,#38a169);padding:36px 30px;text-align:center}
      .hdr h1{color:#fff;margin:0;font-size:24px} .hdr p{color:#c6f6d5;margin:6px 0 0;font-size:14px}
      .body{padding:36px 30px} p{color:#4a5568;font-size:15px}
      table{width:100%;border-collapse:collapse;margin:20px 0}
      th{background:#f7fafc;padding:10px;text-align:left;font-size:13px;color:#718096;border-bottom:2px solid #e2e8f0}
      .earning{background:#f0fff4;border-left:4px solid #38a169;padding:14px 20px;border-radius:4px;margin:16px 0;font-size:15px;color:#276749;font-weight:600}
      .btn{display:inline-block;background:#276749;color:#fff!important;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px}
      .footer{background:#f7fafc;padding:20px;text-align:center}
      .footer p{color:#a0aec0;font-size:12px;margin:0}
    </style></head><body>
    <div class="wrap">
      <div class="hdr"><h1>🛒 New Order Received!</h1><p>Order #${order.orderNumber}</p></div>
      <div class="body">
        <p>Hi <strong>${vendor.name}</strong>, you have a new order!</p>
        <table>
          <thead><tr>
            <th>Product</th><th style="text-align:center">Qty</th>
            <th style="text-align:right">Amount</th><th style="text-align:right">Your Earning</th>
          </tr></thead>
          <tbody>${itemRows}</tbody>
        </table>
        <div class="earning">💰 Total Earning from this order: ৳${totalEarning.toLocaleString()}</div>
        <p><strong>Ship to:</strong><br>
          ${order.shippingAddress.fullName} — ${order.shippingAddress.phone}<br>
          ${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.district}
        </p>
        <div style="text-align:center;margin-top:20px">
          <a href="${process.env.CLIENT_URL}/vendor/orders" class="btn">Process Order →</a>
        </div>
      </div>
      <div class="footer"><p>© ${new Date().getFullYear()} MultiVendor. All rights reserved.</p></div>
    </div></body></html>`;

  await sendEmail({ to: vendor.email, subject: `🛒 New Order #${order.orderNumber} — MultiVendor`, html });
};

// ════════════════════════════════════════════════════════
// Order Status Update (Customer)
// ════════════════════════════════════════════════════════
const sendOrderStatusEmail = async (order, customer, newStatus, note = "") => {
  const statusConfig = {
    processing:        { icon: "⚙️",  color: "#3182ce", label: "Being Processed"   },
    partially_shipped: { icon: "📦",  color: "#d97706", label: "Partially Shipped" },
    shipped:           { icon: "🚚",  color: "#7c3aed", label: "Shipped"           },
    delivered:         { icon: "✅",  color: "#276749", label: "Delivered"         },
    cancelled:         { icon: "❌",  color: "#c53030", label: "Cancelled"         },
    refunded:          { icon: "💸",  color: "#276749", label: "Refunded"          },
  };

  const cfg = statusConfig[newStatus] || { icon: "📋", color: "#4a5568", label: newStatus };

  const html = `
    <!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>
      body{font-family:'Segoe UI',sans-serif;background:#f4f4f4;margin:0;padding:0}
      .wrap{max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)}
      .hdr{background:linear-gradient(135deg,#1a1a2e,#16213e);padding:36px 30px;text-align:center}
      .hdr h1{color:#fff;margin:0;font-size:24px}
      .body{padding:36px 30px} p{color:#4a5568;font-size:15px}
      .status-box{border:2px solid ${cfg.color};border-radius:10px;padding:20px;text-align:center;margin:20px 0}
      .status-icon{font-size:40px;margin-bottom:8px}
      .status-label{font-size:20px;font-weight:700;color:${cfg.color}}
      .btn{display:inline-block;background:${cfg.color};color:#fff!important;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px}
      .footer{background:#f7fafc;padding:20px;text-align:center}
      .footer p{color:#a0aec0;font-size:12px;margin:0}
    </style></head><body>
    <div class="wrap">
      <div class="hdr"><h1>Order Update</h1></div>
      <div class="body">
        <p>Hi <strong>${customer.name}</strong>,</p>
        <p>Your order <strong>#${order.orderNumber}</strong> status has been updated.</p>
        <div class="status-box">
          <div class="status-icon">${cfg.icon}</div>
          <div class="status-label">${cfg.label}</div>
        </div>
        ${note ? `<p style="background:#f7fafc;padding:12px 16px;border-radius:8px;font-size:14px">📝 ${note}</p>` : ""}
        <div style="text-align:center;margin-top:20px">
          <a href="${process.env.CLIENT_URL}/orders/${order._id}" class="btn">View Order →</a>
        </div>
      </div>
      <div class="footer"><p>© ${new Date().getFullYear()} MultiVendor. All rights reserved.</p></div>
    </div></body></html>`;

  await sendEmail({ to: customer.email, subject: `Order ${cfg.label} #${order.orderNumber} — MultiVendor`, html });
};

module.exports = {
  sendOrderConfirmationEmail,
  sendVendorNewOrderEmail,
  sendOrderStatusEmail,
};