# Agentic Auto-Escrow

**An AI agent that holds a freelance payment until the work actually meets the spec, then releases it automatically.**

Built for the [PayPal AI Hackathon](https://paypalaihackathon.devpost.com/).

| | |
|---|---|
| **Live demo** | https://agentic-auto-escrow-1.onrender.com |
| **Backend API** | https://agentic-auto-escrow.onrender.com |
| **Demo video** | https://www.youtube.com/watch?v=rJ1KZ4dXjj8 |
| **License** | MIT |

> The first request after a period of inactivity can take 30 to 60 seconds because the free Render instances sleep. Open the backend URL once and wait for it to answer before testing.

---

## The problem

Freelancers get ghosted after delivering work. Clients pay for work that doesn't match what was agreed. Both sides today rely on trust, or on a human middleman who is slow, costs money and has to read the code.

## The solution

Agentic Auto-Escrow replaces the human middleman with an AI compliance auditor:

1. The **client** writes the project spec, sets a budget and creates an escrow order through the PayPal Sandbox. The client approves the payment in PayPal, but the money is **not captured yet**.
2. The **freelancer** submits their code.
3. An **AI auditor** reads the submission and checks it against the client's acceptance criteria.
4. **If the AI approves**, the backend calls the PayPal Orders API and captures the payment, with no human in the loop. The freelancer sees a green **COMPLETED** confirmation.
5. **If the AI rejects**, no money moves. The freelancer sees the AI's reasoning, fixes the code and resubmits.

The AI doesn't just advise: it is the decision-maker that triggers a real payment API call. That makes this an **agentic commerce** flow.

## How it works

```
Client                Frontend (Next.js)         Backend (Express)            PayPal Sandbox      AI auditor (Gemini)
  |  create escrow  ------>  |  POST /create-order ---->  |  Orders v2: create  ----->  |
  |  approve in PayPal  ---------------------------------------------------------------->  |
Freelancer                   |                            |                              |
  |  submit code  --------->  |  POST /submit-work  ---->  |  spec + code  ------------------------------>  |
  |                           |                            |  <-- verdict + reasoning  ---------------------  |
  |                           |                            |  approved? -> Orders v2: capture  ---->  |
  |  <-- COMPLETED or REJECTED with the AI's reasoning  <--|
```

## Tools used

| Tool | How it is used |
|---|---|
| **PayPal Orders v2 API (Sandbox)** | Creates the escrow order, and captures the payment only after the AI approves the work. OAuth 2.0 access tokens are requested dynamically on the server. |
| **Google Gemini** (`gemini-3.5-flash-lite`) | The AI compliance auditor. It receives the acceptance criteria and the submitted code and returns a structured verdict (approve or reject) with a written justification. Called through the OpenAI Node SDK against Gemini's OpenAI-compatible endpoint. |
| **Render** | Hosts both the Express backend and the Next.js frontend as separate services, deployed from this repository. |
| **Node.js, Express, CORS, dotenv** | Backend API. |
| **Next.js (App Router) and Tailwind CSS** | Frontend dashboard with a Client view and a Freelancer view. |

## Try it as a judge

1. Open the live demo and wake the backend first (see the note above).
2. **Client view** (`/client`): enter a spec, for example *"Write a JavaScript function named `square` that accepts a number and returns its square"*, set a budget and click **Create escrow order**.
3. Click **Approve in PayPal Sandbox** and log in with a sandbox **buyer** account:
   - Email: `<sb-76d5z53714708@personal.example.com>`
   - Password: <M^##lZ8A>

   These are fake PayPal Sandbox credentials. No real money is involved anywhere in this project.
4. Open the **Freelancer view** and submit code.
   - **Matching code**, for example `function square(x) { return x * x; }`, is approved and the green **COMPLETED** banner appears.
   - **Unrelated or broken code** is rejected with the AI's explanation. No payment is captured and the escrow stays intact.

Use a fresh escrow order for each test: a captured order can't be captured again.

If PayPal shows a generic "Things don't appear to be working" page, wait a minute and retry. The Sandbox is occasionally unstable. Using a private/incognito window also helps.

## API

| Endpoint | Purpose |
|---|---|
| `POST /api/escrow/create-order` | Creates a PayPal Sandbox order for the escrow amount. |
| `POST /api/escrow/capture-order` | Captures an approved PayPal Sandbox order. |
| `POST /api/escrow/submit-work` | Sends the spec and submitted code to the AI auditor. On approval it triggers the capture and returns the result. On rejection it returns HTTP 422 with the AI's reasoning. |

## Run it locally

Requirements: Node.js 18 or newer, a PayPal Developer account (Sandbox app) and a Gemini API key.

```bash
git clone https://github.com/Khusnuma33/agentic-auto-escrow.git
cd agentic-auto-escrow
npm install
```

Create a `.env` file in the project root:

```
GEMINI_API_KEY=your_gemini_api_key
PAYPAL_CLIENT_ID=your_paypal_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_paypal_sandbox_client_secret
```

Start the backend (port 5000 locally):

```bash
npm start
```

In a second terminal, start the frontend:

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

```bash
npm run dev
```

Open http://localhost:3000.

An end-to-end test script, `test-api.js`, is also included in the root of the repository.

## Deployment

Both services are deployed on Render from this one repository:

- **Backend:** root directory, build `npm install`, start `npm start`, with the three environment variables above.
- **Frontend:** root directory `frontend`, build `npm install && npm run build`, start `npm start`, with `NEXT_PUBLIC_API_BASE_URL` pointing at the backend URL.

## Limitations and next steps

- **Sandbox only.** No real money moves.
- **Single-snippet review.** The auditor reads the submitted code against the spec. It does not execute the code or run a test suite. Running submissions in a sandboxed test runner, so the verdict is backed by real test results, is the most important next step.
- **Payout routing.** The capture settles into the platform's PayPal Sandbox merchant account. Splitting the payout to a separate freelancer account, plus platform fees, is a next step.
- **Prompt-injection hardening.** Submitted code could contain text aimed at manipulating the auditor. Stricter input handling and a second-opinion model are planned.
- **No accounts or persistent project storage yet.** The demo passes the order and spec between views in the browser.
- **Workflow orchestration.** Moving the audit-then-capture pipeline onto Render Workflows would make it retryable and observable at scale.

## License

Released under the [MIT License](LICENSE).
