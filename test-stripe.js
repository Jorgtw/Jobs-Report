async function main() {
  const params = new URLSearchParams();
  params.append("mode", "subscription");
  params.append("payment_method_types[0]", "card");
  params.append("payment_method_types[1]", "sepa_debit");
  params.append("payment_method_types[2]", "amazon_pay");
  params.append("payment_method_types[3]", "revolut_pay");
  params.append("payment_method_types[4]", "link");
  
  params.append("line_items[0][price]", "price_1TiAiXQL4s145ccHAMmazaPS");
  params.append("line_items[0][quantity]", "1");
  params.append("customer_email", "test@example.com");
  params.append("success_url", "https://example.com/success");
  params.append("cancel_url", "https://example.com/cancel");

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      "Authorization": "Bearer sk_live_...",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString()
  });

  const data = await response.json();
  if (response.ok) {
    console.log("SUCCESS:", data.url);
  } else {
    console.error("ERROR:", data.error.message);
  }
}

main();
