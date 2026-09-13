const Stripe = require("stripe");
const vendors = require("../data/vendors.json");

const FULL_SERVICE_FEE_CENTS = 25000; // $250 flat staffing fee, charged in addition to per-guest pricing

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    res.status(500).json({ error: "Payment is not configured on this server yet." });
    return;
  }

  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    const { vendorId, guests, date, dishes, serviceStyle, name, email, phone } = req.body || {};

    const vendor = vendors.find(v => v.id === vendorId);
    if (!vendor) {
      res.status(400).json({ error: "Unknown vendor." });
      return;
    }

    const guestCount = Math.round(Number(guests));
    if (!Number.isFinite(guestCount) || guestCount < 1) {
      res.status(400).json({ error: "Guest count must be at least 1." });
      return;
    }

    if (!email || !name) {
      res.status(400).json({ error: "Name and email are required." });
      return;
    }

    const dishList = Array.isArray(dishes) ? dishes.filter(d => vendor.dishes.includes(d)) : [];

    // Price is always looked up from vendors.json on the server, never trusted from the client.
    const line_items = [
      {
        price_data: {
          currency: "usd",
          unit_amount: Math.round(vendor.price * 100),
          product_data: {
            name: `${vendor.name} — catering (per guest)`,
            description: dishList.length ? `Dishes: ${dishList.join(", ")}` : undefined,
          },
        },
        quantity: guestCount,
      },
    ];

    if (serviceStyle === "fullservice") {
      line_items.push({
        price_data: {
          currency: "usd",
          unit_amount: FULL_SERVICE_FEE_CENTS,
          product_data: {
            name: "Full-service staffing fee",
            description: `${vendor.name} staff on site to cook and serve`,
          },
        },
        quantity: 1,
      });
    }

    const origin = req.headers.origin || `https://${req.headers.host}`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      customer_email: email,
      metadata: {
        vendorId: vendor.id,
        vendorName: vendor.name,
        vendorEmail: vendor.email,
        guests: String(guestCount),
        date: date || "",
        dishes: dishList.join(", "),
        serviceStyle: serviceStyle || "",
        customerName: name,
        customerPhone: phone || "",
      },
      success_url: `${origin}/index.html?booking=success`,
      cancel_url: `${origin}/index.html?booking=cancelled`,
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not start checkout." });
  }
};
