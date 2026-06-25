import { Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text, } from '@react-email/components';
import * as React from 'react';
export const CancellationConfirmationEmail = ({ recipientName, sessionDate, therapistName, clientName, reason, isClient, appUrl = '', appName = 'TherapyConnect', }) => {
    const otherParty = isClient ? therapistName : clientName;
    const dateStr = sessionDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
    return (<Html>
      <Head />
      <Preview>Session cancellation confirmation</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerTitle}>Session Cancelled</Heading>
          </Section>

          <Section style={content}>
            <Text style={text}>Hello {recipientName},</Text>
            <Text style={text}>Your therapy session has been cancelled.</Text>

            <Section style={detailsBox}>
              <Heading as="h3" style={detailsTitle}>
                Cancelled Session
              </Heading>
              <Text style={row}>
                <strong>{isClient ? 'Therapist' : 'Client'}:</strong> {otherParty}
              </Text>
              <Text style={row}>
                <strong>Date:</strong> {dateStr}
              </Text>
              {reason && (<Text style={row}>
                  <strong>Reason:</strong> {reason}
                </Text>)}
            </Section>

            <Text style={text}>
              {isClient
            ? 'You can book another session with a different therapist or reschedule with the same therapist.'
            : 'You may want to follow up with the client if needed.'}
            </Text>

            {isClient && appUrl && (<Section style={buttonContainer}>
                <Button style={button} href={`${appUrl}/seeker/therapists`}>
                  Find Another Therapist
                </Button>
              </Section>)}

            <Text style={supportText}>
              If you have any questions, please contact our support team.
            </Text>
          </Section>

          <Hr style={hr}/>
          <Section style={footer}>
            <Text style={footerText}>{appName} Support</Text>
          </Section>
        </Container>
      </Body>
    </Html>);
};
export default CancellationConfirmationEmail;
const main = {
    margin: 0,
    padding: 0,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    backgroundColor: '#f5f5f5',
};
const container = {
    maxWidth: '600px',
    margin: '40px auto',
    backgroundColor: '#fff',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
};
const header = {
    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    padding: '40px 30px',
    textAlign: 'center',
};
const headerTitle = {
    margin: 0,
    color: '#fff',
    fontSize: '28px',
    fontWeight: 700,
};
const content = {
    padding: '40px 30px',
};
const text = {
    fontSize: '16px',
    lineHeight: 1.6,
    color: '#333',
    marginTop: 0,
};
const detailsBox = {
    backgroundColor: '#fef3c7',
    borderLeft: '4px solid #f59e0b',
    padding: '20px',
    margin: '30px 0',
    borderRadius: '4px',
};
const detailsTitle = {
    margin: '0 0 10px 0',
    color: '#92400e',
    fontSize: '16px',
};
const row = {
    margin: '5px 0',
    color: '#92400e',
    fontSize: '14px',
};
const buttonContainer = {
    textAlign: 'center',
    margin: '40px 0',
};
const button = {
    display: 'inline-block',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    padding: '16px 40px',
    textDecoration: 'none',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '16px',
};
const supportText = {
    fontSize: '14px',
    lineHeight: 1.6,
    color: '#666',
    marginTop: '30px',
};
const hr = { borderColor: '#e0e0e0' };
const footer = {
    textAlign: 'center',
    padding: '20px',
};
const footerText = {
    color: '#999',
    fontSize: '14px',
    margin: 0,
};
