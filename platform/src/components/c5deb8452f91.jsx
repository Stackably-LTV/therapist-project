import { Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text, } from '@react-email/components';
import * as React from 'react';
export const BookingConfirmationEmail = ({ clientName, therapistName, sessionDate, sessionDuration, joinLink, appName = 'TherapyConnect', supportEmail = 'support@therapyconnect.com', }) => {
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
      <Preview>Your session is confirmed with {therapistName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerTitle}>{appName}</Heading>
            <Text style={headerSubtitle}>Your session is confirmed!</Text>
          </Section>

          <Section style={content}>
            <Heading style={h2}>Hi {clientName},</Heading>
            <Text style={text}>
              Your therapy session has been successfully booked! We&apos;re looking forward to
              supporting you on your mental health journey.
            </Text>

            <Section style={detailsBox}>
              <Heading as="h3" style={detailsTitle}>
                Session Details
              </Heading>
              <Text style={row}>
                <strong style={label}>Therapist:</strong> {therapistName}
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
                View Session Details
              </Button>
            </Section>

            <Section style={expectSection}>
              <Heading as="h4" style={expectTitle}>
                What to expect:
              </Heading>
              <Text style={listItem}>Join the session 5 minutes early to ensure your connection is stable</Text>
              <Text style={listItem}>Find a quiet, private space for your session</Text>
              <Text style={listItem}>Have a notebook ready if you&apos;d like to take notes</Text>
              <Text style={listItem}>You&apos;ll receive a reminder 24 hours before your session</Text>
            </Section>

            <Section style={policyBox}>
              <Text style={policyText}>
                <strong>Cancellation Policy:</strong> Please provide at least 24 hours notice if you
                need to cancel or reschedule your session.
              </Text>
            </Section>
          </Section>

          <Hr style={hr}/>
          <Section style={footer}>
            <Text style={footerText}>
              Questions? Reply to this email or contact us at {supportEmail}
            </Text>
            <Text style={footerBrand}>{appName} - Your mental health, our priority</Text>
          </Section>
        </Container>
      </Body>
    </Html>);
};
export default BookingConfirmationEmail;
const main = {
    backgroundColor: '#f5f5f5',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};
const container = {
    margin: '0 auto',
    maxWidth: '600px',
    padding: '20px',
};
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
const headerSubtitle = {
    color: '#f0f0f0',
    margin: '10px 0 0 0',
};
const content = {
    backgroundColor: '#ffffff',
    padding: '40px 30px',
    border: '1px solid #e0e0e0',
    borderTop: 'none',
    borderRadius: '0 0 10px 10px',
};
const h2 = {
    color: '#667eea',
    marginTop: 0,
    fontSize: '22px',
};
const text = {
    fontSize: '16px',
    color: '#555',
    lineHeight: 1.6,
};
const detailsBox = {
    backgroundColor: '#f8f9fa',
    padding: '25px',
    borderRadius: '8px',
    margin: '30px 0',
};
const detailsTitle = {
    marginTop: 0,
    color: '#333',
    fontSize: '18px',
};
const row = { padding: '10px 0', color: '#333', margin: 0 };
const label = { color: '#666', fontWeight: 500 };
const buttonContainer = {
    textAlign: 'center',
    margin: '40px 0',
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
const expectSection = { marginTop: '30px' };
const expectTitle = { color: '#333', marginTop: 0, fontSize: '16px' };
const listItem = {
    color: '#666',
    paddingLeft: '20px',
    marginBottom: '10px',
    fontSize: '14px',
};
const policyBox = {
    backgroundColor: '#fff3cd',
    borderLeft: '4px solid #ffc107',
    padding: '15px',
    marginTop: '25px',
    borderRadius: '4px',
};
const policyText = {
    margin: 0,
    color: '#856404',
    fontSize: '14px',
};
const hr = { borderColor: '#e0e0e0', margin: '20px 0' };
const footer = {
    textAlign: 'center',
    padding: '20px',
};
const footerText = {
    color: '#999',
    fontSize: '14px',
    margin: '0 0 10px 0',
};
const footerBrand = {
    color: '#667eea',
    margin: 0,
    fontSize: '14px',
};
