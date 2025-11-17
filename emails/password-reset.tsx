import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface PasswordResetEmailProps {
  name?: string;
  resetUrl: string;
}

export const PasswordResetEmail = ({
  name,
  resetUrl,
}: PasswordResetEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Passwort zurücksetzen</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Passwort zurücksetzen</Heading>
          <Text style={text}>
            {name ? `Hallo ${name},` : "Hallo,"}
          </Text>
          <Text style={text}>
            Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts gestellt.
            Klicken Sie auf den untenstehenden Button, um ein neues Passwort festzulegen.
          </Text>

          <Text style={text}>
            Dieser Link ist 1 Stunde lang gültig. Wenn Sie keine Anfrage zum Zurücksetzen des Passworts gestellt haben, können Sie diese E-Mail ignorieren.
          </Text>

          <Section style={buttonContainer}>
            <Link href={resetUrl} style={button}>
              Passwort zurücksetzen
            </Link>
          </Section>

          <Text style={text}>
            Falls der Button nicht funktioniert, kopieren Sie diesen Link in Ihren Browser:
          </Text>
          <Text style={linkText}>{resetUrl}</Text>

          <Text style={footer}>
            Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht direkt auf diese E-Mail.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

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

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "40px 0",
  padding: "0",
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
};

const buttonContainer = {
  margin: "32px 0",
};

const button = {
  backgroundColor: "#000",
  borderRadius: "4px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px 24px",
};

const linkText = {
  color: "#0066cc",
  fontSize: "14px",
  wordBreak: "break-all" as const,
  backgroundColor: "#f6f9fc",
  padding: "12px",
  borderRadius: "4px",
};

const footer = {
  color: "#666",
  fontSize: "12px",
  lineHeight: "24px",
  marginTop: "32px",
};

export default PasswordResetEmail;

