const readline = require('node:readline/promises');
const { stdin, stdout } = require('node:process');

async function runCompleteSystemTest() {
    console.log("⚡ [1/2] Initiating Sandbox Order Creation on Port 5000...");
    const API_BASE_URL = 'http://127.0.0.1:5000';
    let orderId;

    // Step 1: Simulate the client creating the escrow contract hold
    try {
        const response = await fetch(`${API_BASE_URL}/api/escrow/create-order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ budget: 50 })
        });
        const orderData = await response.json();
        
        if (orderData.id) {
            orderId = orderData.id;
            console.log(`📦 Success! PayPal Sandbox Order Created. ID: ${orderId}`);
            console.log("PayPal order links:", orderData.links || []);

            const approvalLink = orderData.links?.find((link) =>
                ['approve', 'payer-action'].includes(link.rel)
            );

            if (!approvalLink?.href) {
                console.error(
                    "❌ PayPal did not return an approval URL. The order cannot be captured until a sandbox buyer approves it."
                );
                return;
            }

            console.log(`👉 Approve the order in a browser: ${approvalLink.href}`);
            const terminal = readline.createInterface({ input: stdin, output: stdout });
            await terminal.question('Press Enter after approving the PayPal Sandbox order...');
            terminal.close();
        } else {
            console.error("❌ Failed to clear PayPal Auth. Check your .env credentials:", orderData);
            return;
        }
    } catch (err) {
        console.error("❌ Network Connection Failure during Step 1:", err.message);
        console.log("👉 Mentor Tip: Make sure your server window is actively running!");
        return;
    }

    // Step 2: Simulate the AI evaluating work and triggering payment autonomously
    console.log("\n🤖 [2/2] Submitting freelancer code to AI compliance engine...");
    try {
        const response = await fetch(`${API_BASE_URL}/api/escrow/submit-work`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                orderId: orderId,
                requirements: "Write a function that calculates the square of a number.",
                submittedCode: "function square(x) { return x * x; }" 
            })
        });
        const auditResult = await response.json();
        console.log("🏆 Full System Audit Output:", auditResult);
    } catch (err) {
        console.error("❌ System Disruption during Step 2:", err.message);
    }
}

runCompleteSystemTest();
