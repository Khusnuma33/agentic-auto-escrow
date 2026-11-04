require("dotenv").config();

const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const PAYPAL_API = "https://api-m.sandbox.paypal.com";

app.use(cors());
app.use(express.json());

const geminiApiKey = process.env.GEMINI_API_KEY?.trim();

if (!geminiApiKey) {
  throw new Error("Missing GEMINI_API_KEY in the .env file");
}

const ai = new OpenAI({
  apiKey: geminiApiKey,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

function getPayPalCredentials() {
  const clientId = process.env.PAYPAL_CLIENT_ID?.trim();
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET in the .env file",
    );
  }

  return { clientId, clientSecret };
}

async function readJsonResponse(response, serviceName) {
  const text = await response.text();
  let data = {};

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(
        `${serviceName} returned invalid JSON with HTTP status ${response.status}`,
      );
    }
  }

  if (!response.ok) {
    const detailItem = Array.isArray(data.details) ? data.details[0] : null;
    const detail =
      detailItem?.description ||
      data.error_description ||
      data.message ||
      data.error ||
      `HTTP ${response.status}`;

    const issue = detailItem?.issue ? ` (${detailItem.issue})` : "";
    throw new Error(`${serviceName} request failed${issue}: ${detail}`);
  }

  return data;
}

async function getPayPalAccessToken() {
  const { clientId, clientSecret } = getPayPalCredentials();

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64",
  );

  let response;

  try {
    response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });
  } catch (error) {
    throw new Error(`Unable to reach PayPal OAuth: ${error.message}`);
  }

  const data = await readJsonResponse(response, "PayPal OAuth");

  if (!data.access_token) {
    throw new Error("PayPal OAuth response did not contain an access token");
  }

  return data.access_token;
}

async function createPayPalOrder(budget) {
  const accessToken = await getPayPalAccessToken();

  const response = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: Number(budget).toFixed(2),
          },
        },
      ],
    }),
  });

  return readJsonResponse(response, "PayPal order creation");
}

async function capturePayPalOrder(orderId) {
  const accessToken = await getPayPalAccessToken();

  const response = await fetch(
    `${PAYPAL_API}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    },
  );

  return readJsonResponse(response, "PayPal order capture");
}

function parseEvaluation(content) {
  const cleanContent = content
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let evaluation;

  try {
    evaluation = JSON.parse(cleanContent);
  } catch {
    throw new Error("Gemini returned invalid JSON for the compliance evaluation");
  }

  if (
    typeof evaluation.criteria_met !== "boolean" ||
    typeof evaluation.justification !== "string"
  ) {
    throw new Error(
      "Gemini response must contain boolean criteria_met and string justification",
    );
  }

  return evaluation;
}

app.post("/api/escrow/create-order", async (req, res) => {
  const { budget } = req.body;

  if (
    (typeof budget !== "number" && typeof budget !== "string") ||
    !Number.isFinite(Number(budget)) ||
    Number(budget) <= 0
  ) {
    return res.status(400).json({
      error: "budget must be a positive number",
    });
  }

  try {
    const order = await createPayPalOrder(budget);
    return res.status(201).json(order);
  } catch (error) {
    console.error("PayPal order creation error:", error);

    return res.status(502).json({
      error: error.message,
    });
  }
});

app.post("/api/escrow/capture-order", async (req, res) => {
  const { orderId } = req.body;

  if (typeof orderId !== "string" || !orderId.trim()) {
    return res.status(400).json({
      error: "orderId is required",
    });
  }

  try {
    const capture = await capturePayPalOrder(orderId.trim());
    return res.status(200).json(capture);
  } catch (error) {
    console.error("PayPal order capture error:", error);

    return res.status(502).json({
      error: error.message,
    });
  }
});

app.post("/api/escrow/submit-work", async (req, res) => {
  const { requirements, submittedCode, orderId } = req.body;

  if (
    typeof requirements !== "string" ||
    !requirements.trim() ||
    typeof submittedCode !== "string" ||
    !submittedCode.trim() ||
    typeof orderId !== "string" ||
    !orderId.trim()
  ) {
    return res.status(400).json({
      error: "requirements, submittedCode, and orderId are required",
    });
  }

  try {
    console.log(
      `Initializing AI compliance evaluation for Order: ${orderId}`,
    );

    const completion = await ai.chat.completions.create({
      model: "gemini-3.5-flash-lite",
      response_format: {
        type: "json_object",
      },
      messages: [
        {
          role: "system",
          content:
            'Evaluate the submitted code against the requirements. Return only JSON in this exact shape: {"criteria_met":true,"justification":"Explain the result clearly."}',
        },
        {
          role: "user",
          content:
            `Requirements:\n${requirements}\n\n` +
            `Submitted Freelancer Code:\n${submittedCode}`,
        },
      ],
    });

    const content = completion?.choices?.[0]?.message?.content;

    if (typeof content !== "string" || !content.trim()) {
      throw new Error("Gemini returned no assistant message content");
    }

    console.log("Raw Gemini response:", content);

    const evaluation = parseEvaluation(content);

    console.log("Evaluation Result:", evaluation);

    if (!evaluation.criteria_met) {
      console.log(
        "Code failed compliance verification. Escrow remains held.",
      );

      return res.status(422).json({
        status: "REJECTED",
        paymentStatus: "HELD",
        reason: evaluation.justification,
      });
    }

    console.log(
      "Code passed verification. Initiating PayPal escrow release.",
    );

    const capture = await capturePayPalOrder(orderId.trim());

    return res.status(200).json({
      status: "APPROVED",
      paymentStatus: capture.status || "COMPLETED",
      reason: evaluation.justification,
      paypalDetails: capture,
    });
  } catch (error) {
    console.error("System Error during evaluation pipeline:", error);

    return res.status(500).json({
      error:
        error.message || "Internal processing disruption during audit",
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Automated Escrow Engine live on port ${PORT}`);
});