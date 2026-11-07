// Payment reconciliation.
//
// Keep the latest event for each transaction. Only a latest successful
// attempt is treated as collected.
// Run: node reconcile.js

const fs = require("fs");

const latestByTxn = new Map();

const lines = fs.readFileSync("payments.jsonl", "utf8").split(/\r?\n/);

for (const line of lines) {
  if (!line.trim()) continue;

  let event;
  try {
    event = JSON.parse(line);
  } catch {
    continue; // Ignore malformed JSON lines as specified in README.
  }

  if (!event || typeof event !== "object" || !event.txn_id) {
    continue; // Ignore events without a transaction ID.
  }

  const txnId = String(event.txn_id);
  const timestamp = Date.parse(event.ts);

  // Every event with txn_id is otherwise valid according to the README.
  const previous = latestByTxn.get(txnId);
  if (!previous || timestamp > previous.timestamp) {
    latestByTxn.set(txnId, { event, timestamp });
  }
}

let total = 0;
let count = 0;

for (const { event } of latestByTxn.values()) {
  if (event.status === "success") {
    total += Number(event.amount);
    count += 1;
  }
}

const expected = Number.parseInt(
  fs.readFileSync("expected.txt", "utf8").trim(),
  10
);

if (count !== expected) {
  console.log(`Check failed: counted ${count} successful payments, expected ${expected}.`);
  console.log("Something in the data isn't being handled the way the README describes.");
  process.exitCode = 1;
} else {
  console.log(`Check passed: ${count} successful payments.`);
  console.log(`Your code: KOYA-${Math.round(total)}`);
}
