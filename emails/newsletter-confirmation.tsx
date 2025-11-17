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

interface NewsletterConfirmationEmailProps {
  name?: string;
  confirmationUrl: string;
}

export const NewsletterConfirmationEmail = ({
  name,
  confirmationUrl,
}: NewsletterConfirmationEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Newsletter-Anmeldung bestätigen</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Newsletter-Anmeldung bestätigen</Heading>
          <Text style={text}>
            {name ? `Hallo ${name},` : "Hallo,"}
          </Text>
          <Text style={text}>
            vielen Dank für deine Anmeldung zu unserem Newsletter! Um deine Anmeldung abzuschließen, 
            klicke bitte auf den untenstehenden Button.
          </Text>

          <Text style={text}>
            Erst nach der Bestätigung erhältst du unsere Newsletter mit hilfreichen Tipps & Tricks 
            rund um das Wohnmobil und Camping.
          </Text>

          <Section style={buttonContainer}>
            <Link href={confirmationUrl} style={button}>
              Newsletter-Anmeldung bestätigen
            </Link>
          </Section>

          <Text style={text}>
            Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:
          </Text>
          <Text style={linkText}>{confirmationUrl}</Text>

          <Text style={text}>
            Dieser Link ist 7 Tage lang gültig. Wenn du dich nicht angemeldet hast, kannst du diese E-Mail ignorieren.
          </Text>

          <Text style={footer}>
            Diese E-Mail wurde automatisch generiert. Bitte antworte nicht direkt auf diese E-Mail.
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

export default NewsletterConfirmationEmail;

