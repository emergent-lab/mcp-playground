import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

type MagicLinkEmailProps = {
  url: string;
};

export default function MagicLinkEmail({ url }: MagicLinkEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Sign in to MCP Playground</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={section}>
            <Heading style={heading}>Sign in to MCP Playground</Heading>
            <Text style={text}>
              Click the button below to securely sign in to MCP Playground. This
              link will expire in 5 minutes.
            </Text>
            <Button href={url} style={button}>
              Sign In to MCP Playground
            </Button>
            <Text style={footer}>
              If you didn't request this email, you can safely ignore it.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
};

const section = {
  padding: "0 48px",
};

const heading = {
  fontSize: "28px",
  fontWeight: "bold",
  marginTop: "48px",
  marginBottom: "16px",
};

const text = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#444",
  marginBottom: "24px",
};

const button = {
  backgroundColor: "#000",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  width: "100%",
  padding: "12px 0",
  marginBottom: "24px",
};

const footer = {
  fontSize: "14px",
  lineHeight: "24px",
  color: "#666",
  marginTop: "24px",
};
