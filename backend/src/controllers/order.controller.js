const Order   = require("../models/orderSchema");
const Product = require("../models/productSchema");
const User    = require("../models/userSchema");
const {
  sendOrderConfirmationEmail,
  sendVendorNewOrderEmail,
  sendOrderStatusEmail,
} = require("../utils/order.email");

// ════════════════════════════════════════════════════════════════
// HELPER: Calculate commission & vendor earning per item
// ════════════════════════════════════════════════════════════════
const calculateItemEarnings = (price, quantity, commissionRate) => {
  const subtotal        = price * quantity;
  const commissionAmount = Math.round((subtotal * commissionRate) / 100);
  const vendorEarning    = subtotal - commissionAmount;
  return { commissionAmount, vendorEarning };
};

// ════════════════════════════════════════════════════════════════
// HELPER: Recalculate overall order status from item statuses
// ════════════════════════════════════════════════════════════════
const recalcOrderStatus = (items) => {
  const statuses = items.map((i) => i.status);
  if (statuses.every((s) => s === "delivered"))  return "delivered";
  if (statuses.every((s) => s === "cancelled"))  return "cancelled";
  if (statuses.some((s)  => s === "shipped"))    return "partially_shipped";
  if (statuses.every((s) => s === "shipped"))    return "shipped";
  if (statuses.some((s)  => s === "processing")) return "processing";
  return "pending";
};

// ═══════════════════════════════════════════════════════════════
// @desc    Place a new order
// @route   POST /api/orders
// @access  Private — Customer
// ═══════════════════════════════════════════════════════════════
const placeOrder = async (req, res) => {
  try {
    const {
      items,           // [{ productId, quantity, variantOption }]
      shippingAddress,
      paymentMethod,   // sslcommerz | stripe | cod | bkash
      couponCode,
      customerNote,
    } = req.body;

    if (!items?.length) {
      return res.status(400).json({ success: false, message: "No items in order." });
    }

    // ── Validate & build order items ───────────────────────────
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId)
        .populate("vendor", "_id name email");

      if (!product || product.status !== "active") {
        return res.status(400).json({
          success: false,
          message: `Product "${item.productId}" is not available.`,
        });
      }

      if (!product.vendor) {
        return res.status(400).json({
          success: false,
          message: `Vendor for product "${product.name}" is no longer active or available.`,
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `"${product.name}" only has ${product.stock} units in stock.`,
        });
      }

      // Use effective price (discountPrice if available)
      const effectivePrice = product.discountPrice > 0 ? product.discountPrice : product.price;
      const rate = product.commissionRate ?? 10;
      const { commissionAmount, vendorEarning } = calculateItemEarnings(
        effectivePrice,
        item.quantity,
        rate
      );

      // Variant info
      let variantInfo = { name: "", label: "" };
      if (item.variantOption && product.hasVariants) {
        for (const variant of product.variants) {
          const option = variant.options.find((o) => o.label === item.variantOption);
          if (option) {
            variantInfo = { name: variant.name, label: option.label };
            break;
          }
        }
      }

      orderItems.push({
        product:          product._id,
        vendor:           product.vendor._id,
        name:             product.name,
        image:            product.images.find((i) => i.isMain)?.url || product.images[0]?.url || "",
        price:            effectivePrice,
        quantity:         item.quantity,
        variant:          variantInfo,
        commissionRate:   rate,
        commissionAmount,
        vendorEarning,
        status:           "pending",
      });

      subtotal += effectivePrice * item.quantity;
    }

    // ── Shipping charge ────────────────────────────────────────
    const shippingCharge = subtotal >= 1000 ? 0 : 60; // free shipping above ৳1000

    // ── Coupon (basic — expand with Coupon model later) ────────
    let discount = 0;
    let couponInfo = { code: "", discountAmount: 0 };
    // TODO: validate coupon from Coupon model

    // ── Final total ────────────────────────────────────────────
    const total = subtotal + shippingCharge - discount;

    // ── Create order ───────────────────────────────────────────
    const order = await Order.create({
      customer:        req.user._id,
      items:           orderItems,
      shippingAddress,
      pricing: {
        subtotal,
        shippingCharge,
        discount,
        tax: 0,
        total,
      },
      payment: {
        method: paymentMethod,
        status: paymentMethod === "cod" ? "pending" : "pending",
      },
      isCOD:        paymentMethod === "cod",
      coupon:       couponInfo,
      customerNote: customerNote || "",
      status:       "pending",
      statusHistory: [{
        status:    "pending",
        note:      "Order placed",
        updatedBy: req.user._id,
      }],
    });

    // ── Deduct stock ───────────────────────────────────────────
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity, salesCount: item.quantity },
      });
    }

    // ── Populate for email ─────────────────────────────────────
    await order.populate("customer", "name email");

    // ── Send confirmation email to customer ────────────────────
    try {
      await sendOrderConfirmationEmail(order, order.customer);
    } catch (e) { console.error("Order confirmation email failed:", e.message); }

    // ── Notify each vendor ─────────────────────────────────────
    const vendorMap = {};
    for (const item of orderItems) {
      const key = item.vendor.toString();
      if (!vendorMap[key]) vendorMap[key] = [];
      vendorMap[key].push(item);
    }

    for (const [vendorId, vendorItems] of Object.entries(vendorMap)) {
      try {
        const vendor = await User.findById(vendorId).select("name email");
        if (vendor) {
          await sendVendorNewOrderEmail(vendor, order, vendorItems);
          // Update vendor stats
          const earning = vendorItems.reduce((s, i) => s + i.vendorEarning, 0);
          await User.findByIdAndUpdate(vendorId, {
            $inc: {
              "vendorInfo.totalSales":   vendorItems.reduce((s, i) => s + i.quantity, 0),
              "vendorInfo.totalRevenue": earning,
            },
          });
        }
      } catch (e) { console.error("Vendor notification failed:", e.message); }
    }

    res.status(201).json({
      success: true,
      message: "Order placed successfully!",
      data: {
        _id:         order._id,
        orderNumber: order.orderNumber,
        total:       order.pricing.total,
        status:      order.status,
        payment:     order.payment,
      },
    });
  } catch (error) {
    console.error("placeOrder Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error.",
      errors: error.errors,
    });
  }
};

// ═══════════════════════════════════════════════════════════════
// @desc    Get customer's own orders
// @route   GET /api/orders/my-orders
// @access  Private — Customer
// ═══════════════════════════════════════════════════════════════
const getMyOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const filter = { customer: req.user._id };
    if (status) filter.status = status;

    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, parseInt(limit));

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .select("-statusHistory -adminNote")
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Order.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: orders,
    });
  } catch (error) {
    console.error("getMyOrders Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ═══════════════════════════════════════════════════════════════
// @desc    Get single order detail
// @route   GET /api/orders/:id
// @access  Private — Customer (own) / Vendor (their items) / Admin
// ═══════════════════════════════════════════════════════════════
const getOrderDetail = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("customer", "name email phone avatar")
      .populate("items.product", "name slug images")
      .populate("items.vendor",  "name vendorInfo.shopName")
      .populate("statusHistory.updatedBy", "name role");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    // Access control
    const isCustomer = order.customer._id.toString() === req.user._id.toString();
    const isAdmin    = req.user.role === "admin";
    const isVendor   = order.items.some((i) => i.vendor._id.toString() === req.user._id.toString());

    if (!isCustomer && !isAdmin && !isVendor) {
      return res.status(403).json({ success: false, message: "Not authorized." });
    }

    // If vendor — only show their items
    let responseOrder = order.toObject();
    if (isVendor && !isAdmin) {
      responseOrder.items = responseOrder.items.filter(
        (i) => i.vendor._id.toString() === req.user._id.toString()
      );
    }

    res.status(200).json({ success: true, data: responseOrder });
  } catch (error) {
    console.error("getOrderDetail Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ═══════════════════════════════════════════════════════════════
// @desc    Customer cancel order (only if pending/processing)
// @route   PATCH /api/orders/:id/cancel
// @access  Private — Customer
// ═══════════════════════════════════════════════════════════════
const cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    if (order.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized." });
    }

    if (!["pending", "processing"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: "Order cannot be cancelled at this stage.",
      });
    }

    // Restore stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity, salesCount: -item.quantity },
      });
    }

    order.status              = "cancelled";
    order.cancelledAt         = new Date();
    order.cancellationReason  = reason || "Cancelled by customer";
    order.cancelledBy         = req.user._id;
    order.items.forEach((item) => { item.status = "cancelled"; });

    order.statusHistory.push({
      status:    "cancelled",
      note:      reason || "Cancelled by customer",
      updatedBy: req.user._id,
    });

    await order.save();

    // Notify customer
    try {
      const customer = await User.findById(req.user._id).select("name email");
      await sendOrderStatusEmail(order, customer, "cancelled", reason);
    } catch (e) { console.error("Cancel email failed:", e.message); }

    res.status(200).json({ success: true, message: "Order cancelled successfully." });
  } catch (error) {
    console.error("cancelOrder Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ═══════════════════════════════════════════════════════════════
// @desc    Vendor — get their orders
// @route   GET /api/orders/vendor/my-orders
// @access  Private — Vendor
// ═══════════════════════════════════════════════════════════════
const getVendorOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const filter = { "items.vendor": req.user._id };
    if (status) filter["items.status"] = status;

    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, parseInt(limit));

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("customer", "name email phone")
        .select("-statusHistory -adminNote")
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Order.countDocuments(filter),
    ]);

    // Show only this vendor's items in each order
    const filteredOrders = orders.map((order) => ({
      ...order,
      items: order.items.filter((i) => i.vendor.toString() === req.user._id.toString()),
    }));

    res.status(200).json({
      success: true,
      count: filteredOrders.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: filteredOrders,
    });
  } catch (error) {
    console.error("getVendorOrders Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ═══════════════════════════════════════════════════════════════
// @desc    Vendor — update item status (process/ship)
// @route   PATCH /api/orders/:orderId/items/:itemId/status
// @access  Private — Vendor
// ═══════════════════════════════════════════════════════════════
const updateItemStatus = async (req, res) => {
  try {
    const { status, trackingNo, carrier, note } = req.body;

    const allowed = ["processing", "shipped", "delivered"];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Vendor can only set status to: ${allowed.join(", ")}`,
      });
    }

    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    const item = order.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found." });
    }

    // Only item's vendor can update
    if (item.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized." });
    }

    item.status = status;

    if (status === "shipped") {
      item.tracking.trackingNo  = trackingNo || "";
      item.tracking.carrier     = carrier    || "";
      item.tracking.shippedAt   = new Date();
    }

    if (status === "delivered") {
      item.tracking.deliveredAt = new Date();
    }

    // Recalculate overall order status
    order.status = recalcOrderStatus(order.items);

    order.statusHistory.push({
      status:    order.status,
      note:      note || `Item "${item.name}" marked as ${status}`,
      updatedBy: req.user._id,
    });

    await order.save();

    // Notify customer on ship/deliver
    if (["shipped", "delivered"].includes(status)) {
      try {
        const customer = await User.findById(order.customer).select("name email");
        await sendOrderStatusEmail(order, customer, status, note);
      } catch (e) { console.error("Status email failed:", e.message); }
    }

    res.status(200).json({
      success: true,
      message: `Item marked as ${status}.`,
      data: { orderStatus: order.status, itemStatus: item.status },
    });
  } catch (error) {
    console.error("updateItemStatus Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ═══════════════════════════════════════════════════════════════
// @desc    Admin — get all orders
// @route   GET /api/orders/admin/all
// @access  Private — Admin
// ═══════════════════════════════════════════════════════════════
const adminGetAllOrders = async (req, res) => {
  try {
    const {
      page = 1, limit = 20,
      status, paymentStatus,
      search, startDate, endDate,
    } = req.query;

    const filter = {};
    if (status)        filter.status               = status;
    if (paymentStatus) filter["payment.status"]    = paymentStatus;
    if (search)        filter.orderNumber           = { $regex: search, $options: "i" };
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate)   filter.createdAt.$lte = new Date(endDate);
    }

    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, parseInt(limit));

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("customer", "name email")
        .select("-statusHistory")
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Order.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: orders,
    });
  } catch (error) {
    console.error("adminGetAllOrders Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ═══════════════════════════════════════════════════════════════
// @desc    Admin — update order status
// @route   PATCH /api/orders/admin/:id/status
// @access  Private — Admin
// ═══════════════════════════════════════════════════════════════
const adminUpdateOrderStatus = async (req, res) => {
  try {
    const { status, note } = req.body;

    const validStatuses = ["processing", "shipped", "delivered", "cancelled", "refunded"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status." });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    const prevStatus = order.status;
    order.status = status;

    // Update all items
    order.items.forEach((item) => {
      if (!["cancelled", "returned"].includes(item.status)) {
        item.status = status === "cancelled" ? "cancelled" : status;
      }
    });

    if (status === "cancelled") {
      order.cancelledAt  = new Date();
      order.cancelledBy  = req.user._id;
      order.cancellationReason = note || "Cancelled by admin";

      // Restore stock if was processing
      if (prevStatus !== "cancelled") {
        for (const item of order.items) {
          await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: item.quantity, salesCount: -item.quantity },
          });
        }
      }
    }

    order.statusHistory.push({
      status,
      note:      note || `Status updated to ${status} by admin`,
      updatedBy: req.user._id,
    });

    await order.save();

    // Notify customer
    try {
      const customer = await User.findById(order.customer).select("name email");
      await sendOrderStatusEmail(order, customer, status, note);
    } catch (e) { console.error("Admin status email failed:", e.message); }

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}.`,
      data: { status: order.status },
    });
  } catch (error) {
    console.error("adminUpdateOrderStatus Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ═══════════════════════════════════════════════════════════════
// @desc    Admin — order stats for dashboard
// @route   GET /api/orders/admin/stats
// @access  Private — Admin
// ═══════════════════════════════════════════════════════════════
const getOrderStats = async (req, res) => {
  try {
    const { period = "month" } = req.query;

    const now   = new Date();
    const start = new Date();
    if      (period === "today") start.setHours(0, 0, 0, 0);
    else if (period === "week")  start.setDate(now.getDate() - 7);
    else if (period === "month") start.setMonth(now.getMonth() - 1);
    else if (period === "year")  start.setFullYear(now.getFullYear() - 1);

    const [overview] = await Order.aggregate([
      { $match: { createdAt: { $gte: start } } },
      {
        $group: {
          _id:          null,
          totalOrders:  { $sum: 1 },
          totalRevenue: { $sum: "$pricing.total" },
          pending:      { $sum: { $cond: [{ $eq: ["$status", "pending"]    }, 1, 0] } },
          processing:   { $sum: { $cond: [{ $eq: ["$status", "processing"] }, 1, 0] } },
          shipped:      { $sum: { $cond: [{ $eq: ["$status", "shipped"]    }, 1, 0] } },
          delivered:    { $sum: { $cond: [{ $eq: ["$status", "delivered"]  }, 1, 0] } },
          cancelled:    { $sum: { $cond: [{ $eq: ["$status", "cancelled"]  }, 1, 0] } },
          avgOrderValue:{ $avg: "$pricing.total" },
        },
      },
    ]);

    // Daily revenue for chart (last 30 days)
    const dailyRevenue = await Order.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, status: { $ne: "cancelled" } } },
      {
        $group: {
          _id:     { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$pricing.total" },
          orders:  { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: { overview: overview || {}, dailyRevenue },
    });
  } catch (error) {
    console.error("getOrderStats Error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = {
  placeOrder,
  getMyOrders,
  getOrderDetail,
  cancelOrder,
  getVendorOrders,
  updateItemStatus,
  adminGetAllOrders,
  adminUpdateOrderStatus,
  getOrderStats,
};