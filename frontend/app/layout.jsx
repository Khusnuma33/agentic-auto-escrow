import "./globals.css";

export const metadata = {
  title: "Agentic Auto-Escrow",
  description: "AI-verified freelance payments powered by PayPal Sandbox",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
