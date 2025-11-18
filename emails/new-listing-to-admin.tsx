import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Section,
  Link,
  Button,
  Preview,
} from "@react-email/components";

interface NewListingToAdminEmailProps {
  adminName?: string;
  listingTitle: string;
  landlordName?: string;
  landlordEmail: string;
  listingUrl: string;
}

export const NewListingToAdminEmail = ({
  adminName,
  listingTitle,
  landlordName,
  landlordEmail,
  listingUrl,
}: NewListingToAdminEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Neues Wohnmobil wartet auf Freigabe: {listingTitle}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Neues Wohnmobil wartet auf Freigabe</Heading>
          <Text style={text}>
            {adminName ? `Hallo ${adminName},` : "Hallo,"}
          </Text>
          <Text style={text}>
            ein neues Wohnmobil wurde von einem Vermieter eingestellt und wartet auf deine Prüfung und Freigabe.
          </Text>

          <Section style={infoBox}>
            <Text style={infoLabel}>Wohnmobil:</Text>
            <Text style={infoValue}>{listingTitle}</Text>
            
            <Text style={infoLabel}>Vermieter:</Text>
            <Text style={infoValue}>
              {landlordName ? `${landlordName} (${landlordEmail})` : landlordEmail}
            </Text>
          </Section>

          <Text style={text}>
            Bitte prüfe das Wohnmobil und gib es frei, damit es auf der Plattform sichtbar wird.
          </Text>

          <Section style={buttonContainer}>
            <Button href={listingUrl} style={button}>
              Wohnmobil prüfen und freigeben
            </Button>
          </Section>

          <Text style={text}>
            Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:
          </Text>
          <Text style={linkText}>{listingUrl}</Text>

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
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "600px",
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
  marginBottom: "16px",
};

const infoBox = {
  backgroundColor: "#f6f9fc",
  border: "1px solid #e0e0e0",
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
};

const infoLabel = {
  color: "#666",
  fontSize: "14px",
  fontWeight: "bold",
  margin: "8px 0 4px 0",
};

const infoValue = {
  color: "#333",
  fontSize: "16px",
  margin: "0 0 16px 0",
};

const buttonContainer = {
  padding: "27px 0 27px",
};

const button = {
  backgroundColor: "#16a34a",
  borderRadius: "5px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px 24px",
};

const linkText = {
  color: "#2563eb",
  fontSize: "14px",
  wordBreak: "break-all" as const,
  marginBottom: "16px",
};

const footer = {
  color: "#898989",
  fontSize: "12px",
  lineHeight: "22px",
  marginTop: "32px",
  textAlign: "center" as const,
};

