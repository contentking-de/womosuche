import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface InquiryConfirmationToRenterEmailProps {
  renterName: string;
  listingTitle: string;
  ownerName?: string;
}

export const InquiryConfirmationToRenterEmail = ({
  renterName,
  listingTitle,
  ownerName,
}: InquiryConfirmationToRenterEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Ihre Buchungsanfrage wurde erfolgreich übermittelt</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Anfrage erhalten</Heading>
          <Text style={text}>Hallo {renterName},</Text>
          <Text style={text}>
            Vielen Dank für Ihre Anfrage zum Wohnmobil{" "}
            <strong>{listingTitle}</strong>.
          </Text>
          <Text style={text}>
            {ownerName
              ? `${ownerName} wird sich in Kürze bei Ihnen melden.`
              : "Der Vermieter wird sich in Kürze bei Ihnen melden."}
          </Text>
          <Text style={text}>
            Sie erhalten eine E-Mail, sobald der Vermieter auf Ihre Anfrage
            antwortet.
          </Text>
          <Text style={footer}>
            Mit freundlichen Grüßen,
            <br />
            Das Team von Wohnmobil Vermietung
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

const footer = {
  color: "#666",
  fontSize: "14px",
  lineHeight: "24px",
  marginTop: "32px",
};

export default InquiryConfirmationToRenterEmail;

