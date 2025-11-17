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

interface NewInquiryToOwnerEmailProps {
  ownerName?: string;
  listingTitle: string;
  renterName: string;
  renterEmail: string;
  startDate?: string;
  endDate?: string;
  message: string;
  inquiryUrl: string;
}

export const NewInquiryToOwnerEmail = ({
  ownerName,
  listingTitle,
  renterName,
  renterEmail,
  startDate,
  endDate,
  message,
  inquiryUrl,
}: NewInquiryToOwnerEmailProps) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };
  return (
    <Html>
      <Head />
      <Preview>Neue Buchungsanfrage für {listingTitle}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Neue Buchungsanfrage</Heading>
          <Text style={text}>
            {ownerName ? `Hallo ${ownerName},` : "Hallo,"}
          </Text>
          <Text style={text}>
            Sie haben eine neue Buchungsanfrage für Ihr Wohnmobil{" "}
            <strong>{listingTitle}</strong> erhalten.
          </Text>

          <Section style={section}>
            <Text style={label}>Von:</Text>
            <Text style={value}>{renterName}</Text>
            <Text style={value}>{renterEmail}</Text>
          </Section>

          {(startDate || endDate) && (
            <Section style={section}>
              <Text style={label}>Reisezeitraum:</Text>
              {startDate && (
                <Text style={value}>
                  Reisebeginn: {formatDate(startDate)}
                </Text>
              )}
              {endDate && (
                <Text style={value}>
                  Reiseende: {formatDate(endDate)}
                </Text>
              )}
            </Section>
          )}

          <Section style={section}>
            <Text style={label}>Nachricht:</Text>
            <Text style={messageText}>{message}</Text>
          </Section>

          <Section style={buttonContainer}>
            <Link href={inquiryUrl} style={button}>
              Anfrage im Dashboard ansehen
            </Link>
          </Section>

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

const section = {
  margin: "24px 0",
};

const label = {
  color: "#666",
  fontSize: "14px",
  fontWeight: "bold",
  marginBottom: "4px",
};

const value = {
  color: "#333",
  fontSize: "16px",
  margin: "0",
};

const messageText = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "24px",
  whiteSpace: "pre-wrap",
  backgroundColor: "#f6f9fc",
  padding: "16px",
  borderRadius: "4px",
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

const footer = {
  color: "#666",
  fontSize: "12px",
  lineHeight: "24px",
  marginTop: "32px",
};

export default NewInquiryToOwnerEmail;

