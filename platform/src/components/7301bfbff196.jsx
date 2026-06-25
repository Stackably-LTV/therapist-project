import { Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text, } from '@react-email/components';
import * as React from 'react';
export const PaymentFailedEmail = ({ clientName, amount, currency, appUrl = '', appName = 'TherapyConnect', }) => {
    const amountStr = currency === 'USD' ? `$${amount}` : `${amount} ${currency}`;
    return (<Html>
      <Head />
      <Preview>Payment failed - action required</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerTitle}>Payment Failed</Heading>
          </Section>

          <Section style={content}>
            <Text style={text}>Hello {clientName},</Text>
            <Text style={text}>
              We were unable to process your payment of <strong>{amountStr}</strong>.
            </Text>

            <Section style={alertBox}>
              <Text style={alertText}>
                Action Required: Please update your payment method to continue your session.
              </Text>
            </Section>

            <Text style={text}>
              Please update your payment information and try again to avoid any interruption to
              your therapy sessions.
            </Text>

            <Section style={buttonContainer}>
              <Button style={button} href={`${appUrl}/seeker/bookings`}>
                Update Payment Method
              </Button>
            </Section>

            <Text style={supportText}>
              If you have any questions or need assistance, please contact our support team.
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
export default PaymentFailedEmail;
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
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
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
const alertBox = {
    backgroundColor: '#fef2f2',
    borderLeft: '4px solid #ef4444',
    padding: '20px',
    margin: '30px 0',
    borderRadius: '4px',
};
const alertText = {
    margin: 0,
    color: '#991b1b',
    fontWeight: 500,
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
