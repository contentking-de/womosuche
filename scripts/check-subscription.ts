import { prisma } from "../lib/prisma";
import { stripe } from "../lib/stripe";

async function checkSubscription() {
  const email = "user7@contentking.de";
  
  // Finde User
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.log(`User ${email} nicht gefunden`);
    return;
  }

  console.log(`\n=== User gefunden: ${user.email} (${user.id}) ===\n`);

  // Hole Subscription aus DB
  const dbSubscription = await prisma.subscription.findUnique({
    where: { userId: user.id },
  });

  console.log("=== Datenbank Subscription ===");
  if (dbSubscription) {
    console.log(JSON.stringify(dbSubscription, null, 2));
  } else {
    console.log("Keine Subscription in DB gefunden");
  }

  if (dbSubscription?.stripeCustomerId) {
    console.log("\n=== Stripe Subscriptions ===");
    
    // Hole alle Subscriptions von Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: dbSubscription.stripeCustomerId,
      status: "all",
      limit: 10,
    });

    const sortedSubscriptions = subscriptions.data.sort((a, b) => b.created - a.created);
    
    console.log(`\nGefunden: ${sortedSubscriptions.length} Subscriptions\n`);
    
    for (const sub of sortedSubscriptions) {
      const priceId = sub.items.data[0]?.price.id;
      let productName = "Unbekannt";
      
      if (priceId) {
        try {
          const price = await stripe.prices.retrieve(priceId, {
            expand: ["product"],
          });
          const product = typeof price.product === "string"
            ? await stripe.products.retrieve(price.product)
            : price.product;
          productName = product.name;
        } catch (error) {
          console.error("Error fetching product:", error);
        }
      }
      
      console.log(`- Subscription ID: ${sub.id}`);
      console.log(`  Status: ${sub.status}`);
      console.log(`  Created: ${new Date(sub.created * 1000).toISOString()}`);
      console.log(`  Price ID: ${priceId}`);
      console.log(`  Product: ${productName}`);
      console.log(`  Aktuell in DB: ${sub.id === dbSubscription.stripeSubscriptionId ? "JA" : "NEIN"}`);
      console.log("");
    }

    // Finde neueste aktive Subscription
    const activeSubscription = sortedSubscriptions.find(
      (sub) => sub.status === "active" || sub.status === "trialing"
    );

    if (activeSubscription) {
      const priceId = activeSubscription.items.data[0]?.price.id;
      console.log(`\n=== Neueste aktive Subscription ===`);
      console.log(`Subscription ID: ${activeSubscription.id}`);
      console.log(`Price ID: ${priceId}`);
      console.log(`Status: ${activeSubscription.status}`);
      
      if (priceId) {
        const price = await stripe.prices.retrieve(priceId, {
          expand: ["product"],
        });
        const product = typeof price.product === "string"
          ? await stripe.products.retrieve(price.product)
          : price.product;
        console.log(`Product: ${product.name}`);
        console.log(`Amount: ${price.unit_amount ? price.unit_amount / 100 : 0} ${price.currency}`);
      }
      
      if (activeSubscription.id !== dbSubscription.stripeSubscriptionId) {
        console.log(`\n⚠️  WARNUNG: DB hat andere Subscription ID!`);
        console.log(`DB Subscription ID: ${dbSubscription.stripeSubscriptionId}`);
        console.log(`Stripe aktive Subscription ID: ${activeSubscription.id}`);
      }
    }
  }
}

checkSubscription()
  .then(() => {
    console.log("\n✓ Fertig");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fehler:", error);
    process.exit(1);
  });

