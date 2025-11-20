import { prisma } from "../lib/prisma";
import { stripe } from "../lib/stripe";

async function fixSubscription() {
  const email = "user7@contentking.de";
  
  // Finde User
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.log(`User ${email} nicht gefunden`);
    return;
  }

  console.log(`\n=== Fixe Subscription für User: ${user.email} ===\n`);

  // Hole Subscription aus DB
  const dbSubscription = await prisma.subscription.findUnique({
    where: { userId: user.id },
  });

  if (!dbSubscription?.stripeCustomerId) {
    console.log("Keine Subscription in DB gefunden");
    return;
  }

  // Hole alle Subscriptions von Stripe
  const subscriptions = await stripe.subscriptions.list({
    customer: dbSubscription.stripeCustomerId,
    status: "all",
    limit: 10,
  });

  const sortedSubscriptions = subscriptions.data.sort((a, b) => b.created - a.created);
  
  // Finde neueste aktive Subscription
  const activeSubscription = sortedSubscriptions.find(
    (sub) => sub.status === "active" || sub.status === "trialing"
  );

  if (!activeSubscription) {
    console.log("Keine aktive Subscription in Stripe gefunden");
    return;
  }

  const priceId = activeSubscription.items.data[0]?.price.id;
  
  if (!priceId) {
    console.log("Keine Price ID in aktiver Subscription gefunden");
    return;
  }

  // Hole Preis-Details
  const price = await stripe.prices.retrieve(priceId, {
    expand: ["product"],
  });
  
  const product = typeof price.product === "string"
    ? await stripe.products.retrieve(price.product)
    : price.product;

  console.log(`Aktuelle DB Subscription: ${dbSubscription.stripeSubscriptionId}`);
  console.log(`Neue Stripe Subscription: ${activeSubscription.id}`);
  console.log(`Aktueller DB Price: ${dbSubscription.stripePriceId}`);
  console.log(`Neuer Stripe Price: ${priceId}`);
  console.log(`Product: ${product.name}`);
  console.log(`Amount: ${price.unit_amount ? price.unit_amount / 100 : 0} ${price.currency}\n`);

  // Aktualisiere die Subscription in der DB
  const updated = await prisma.subscription.update({
    where: { userId: user.id },
    data: {
      stripeSubscriptionId: activeSubscription.id,
      stripePriceId: priceId,
      status: activeSubscription.status,
      currentPeriodEnd: new Date(activeSubscription.current_period_end * 1000),
      cancelAtPeriodEnd: activeSubscription.cancel_at_period_end || false,
    },
  });

  console.log("✓ Subscription erfolgreich aktualisiert!");
  console.log(`\nNeue DB Subscription:`);
  console.log(JSON.stringify(updated, null, 2));
}

fixSubscription()
  .then(() => {
    console.log("\n✓ Fertig");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fehler:", error);
    process.exit(1);
  });

