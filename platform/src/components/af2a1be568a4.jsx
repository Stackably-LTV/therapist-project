import { Body, Container, Head, Heading, Html, Preview, Section, Text, Button, } from '@react-email/components';
import * as React from 'react';
export default function TherapistDecisionEmail({ therapistName, headline, body, reason, supportEmail = 'support@psychlink.pro', ctaLabel = 'Open Dashboard', ctaHref = 'https://psychlink.pro/login', appName = 'Psychlink.pro', }) {
    return (<Html>
      <Head />
      <Preview>{appName} account update</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{headline}</Heading>

          <Text style={text}>Hi {therapistName},</Text>

          <Text style={text}>{body}</Text>

          {reason && (<Section style={reasonBox}>
              <Text style={reasonLabel}>Review Notes</Text>
              <Text style={reasonText}>{reason}</Text>
            </Section>)}

          <Section style={buttonContainer}>
            <Button style={button} href={ctaHref}>
              {ctaLabel}
            </Button>
          </Section>

          <Text style={text}>
            If you have any questions, reply to this email or contact us at{' '}
            <a href={`mailto:${supportEmail}`} style={link}>
              {supportEmail}
            </a>
            .
          </Text>

          <Text style={footer}>
            — The {appName} Team
          </Text>
        </Container>
      </Body>
    </Html>);
}
const main = {
    backgroundColor: '#f5f5ff',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};
const container = {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    padding: '32px 0 48px',
    marginBottom: '64px',
    maxWidth: '640px',
};
const h1 = {
    color: '#111827',
    fontSize: '30px',
    fontWeight: 700,
    margin: '24px 40px 16px',
};
const text = {
    color: '#374151',
    fontSize: '16px',
    lineHeight: '26px',
    margin: '16px 40px',
};
const reasonBox = {
    margin: '16px 40px',
    borderRadius: '12px',
    backgroundColor: '#eef2ff',
    border: '1px solid #c7d2fe',
    padding: '20px',
};
const reasonLabel = {
    fontSize: '14px',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#4338ca',
    marginBottom: '8px',
};
const reasonText = {
    color: '#312e81',
    fontSize: '16px',
    lineHeight: '24px',
    whiteSpace: 'pre-line',
};
const buttonContainer = {
    padding: '16px 40px 8px',
};
const button = {
    backgroundColor: '#4f46e5',
    borderRadius: '999px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 600,
    textDecoration: 'none',
    padding: '14px 28px',
    display: 'inline-block',
};
const link = {
    color: '#4f46e5',
    textDecoration: 'underline',
};
const footer = {
    color: '#6b7280',
    fontSize: '14px',
    lineHeight: '22px',
    margin: '32px 40px 0',
};
