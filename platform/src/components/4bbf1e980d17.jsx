import { Body, Button, Container, Head, Html, Preview, Section, Text, } from '@react-email/components';
import * as React from 'react';
export const TherapistBookingNotificationEmail = ({ clientName, sessionDate, sessionDuration, joinLink, appName = 'TherapyConnect', }) => {
    const dateStr = sessionDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    const timeStr = sessionDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
    return (<Html>
      <Head />
      <Preview>New session booked with {clientName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={headerTitle}>New Session Booked</Text>
          </Section>

          <Section style={content}>
            <Text style={text}>
              A new therapy session has been booked with you.
            </Text>

            <Section style={detailsBox}>
              <Text style={detailsTitle}>Session Details</Text>
              <Text style={row}>
                <strong style={label}>Client:</strong> {clientName}
              </Text>
              <Text style={row}>
                <strong style={label}>Date & Time:</strong> {dateStr}, {timeStr}
              </Text>
              <Text style={row}>
                <strong style={label}>Duration:</strong> {sessionDuration} minutes
              </Text>
            </Section>

            <Section style={buttonContainer}>
              <Button style={button} href={joinLink}>
                View in Dashboard
              </Button>
            </Section>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>{appName}</Text>
          </Section>
        </Container>
      </Body>
    </Html>);
};
export default TherapistBookingNotificationEmail;
const main = {
    backgroundColor: '#f5f5f5',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    lineHeight: 1.6,
    color: '#333',
    maxWidth: '600px',
    margin: '0 auto',
    padding: '20px',
};
const container = { margin: '0 auto' };
const header = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '40px 20px',
    textAlign: 'center',
    borderRadius: '10px 10px 0 0',
};
const headerTitle = {
    color: '#fff',
    margin: 0,
    fontSize: '28px',
};
const content = {
    backgroundColor: '#ffffff',
    padding: '40px 30px',
    border: '1px solid #e0e0e0',
    borderTop: 'none',
    borderRadius: '0 0 10px 10px',
};
const text = { fontSize: '16px', color: '#555' };
const detailsBox = {
    backgroundColor: '#f8f9fa',
    padding: '25px',
    borderRadius: '8px',
    margin: '30px 0',
};
const detailsTitle = { marginTop: 0, color: '#333', fontSize: '18px' };
const row = { padding: '10px 0', color: '#333', margin: 0 };
const label = { color: '#666' };
const buttonContainer = {
    textAlign: 'center',
    margin: '30px 0',
};
const button = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    padding: '16px 40px',
    textDecoration: 'none',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '16px',
};
const footer = {
    textAlign: 'center',
    padding: '20px',
};
const footerText = {
    color: '#999',
    fontSize: '14px',
    margin: 0,
};
