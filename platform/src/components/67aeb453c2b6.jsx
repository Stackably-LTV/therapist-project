import { Body, Container, Head, Heading, Hr, Html, Preview, Section, Text, } from '@react-email/components';
import * as React from 'react';
export const RefundConfirmationEmail = ({ clientName, amount, currency, sessionDate, therapistName, appName = 'TherapyConnect', }) => {
    const amountStr = currency === 'USD' ? `$${amount}` : `${amount} ${currency}`;
    const dateStr = sessionDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    return (<Html>
      <Head />
      <Preview>Your refund has been processed</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerTitle}>Refund Processed</Heading>
          </Section>

          <Section style={content}>
            <Text style={text}>Hello {clientName},</Text>
            <Text style={text}>
              Your refund of <strong>{amountStr}</strong> has been processed successfully.
            </Text>

            <Section style={detailsBox}>
              <Heading as="h3" style={detailsTitle}>
                Session Details
              </Heading>
              <Text style={row}>
                <strong>Therapist:</strong> {therapistName}
              </Text>
              <Text style={row}>
                <strong>Date:</strong> {dateStr}
              </Text>
            </Section>

            <Text style={text}>
              The refund will appear in your account within 5-10 business days.
            </Text>
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
export default RefundConfirmationEmail;
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
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
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
    backgroundColor: '#f0fdf4',
    borderLeft: '4px solid #10b981',
    padding: '20px',
    margin: '30px 0',
    borderRadius: '4px',
};
const detailsTitle = {
    margin: '0 0 10px 0',
    color: '#065f46',
    fontSize: '16px',
};
const row = {
    margin: '5px 0',
    color: '#065f46',
    fontSize: '14px',
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
