import "dotenv-flow/config";
import MagicLinkEmail from "../emails/magic-link";
import { getResend } from "../src/lib/email/resend";

async function main() {
  const testEmail = process.argv[2] || "paulruales1@gmail.com";
  const testUrl =
    process.argv[3] ||
    "http://localhost:3000/api/auth/magic-link/verify?token=test-token-123";

  console.log(`Sending test magic link email to: ${testEmail}`);

  try {
    const resend = getResend();
    const result = await resend.emails.send({
      from: "Magic Link <hello@auth.mcpplayground.io>",
      to: testEmail,
      subject: "Sign in to MCP Playground",
      react: MagicLinkEmail({ url: testUrl }),
    });

    console.log("✅ Email sent successfully!");
    console.log("Result:", result);
  } catch (error) {
    console.error("❌ Failed to send email:", error);
    process.exit(1);
  }
}

main();
