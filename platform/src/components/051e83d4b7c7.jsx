import { Body, Container, Head, Heading, Html, Preview, Section, Text, Button, } from '@react-email/components';
import * as React from 'react';
export const TherapistApprovedEmail = ({ therapistName = 'Dr. Smith', dashboardUrl = 'https://example.com/therapist', appName = 'Psychlink.pro', }) => {
    return (<Html>
      <Head />
      <Preview>Your therapist account has been approved!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome to {appName}!</Heading>
          
          <Text style={text}>Hi {therapistName},</Text>
          
          <Text style={text}>
            Great news! Your therapist application has been approved. You can now access your dashboard and start accepting clients.
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={dashboardUrl}>
              Access Your Dashboard
            </Button>
          </Section>

          <Text style={text}>
            <strong>Next Steps:</strong>
          </Text>
          
          <Text style={listItem}>• Complete your profile with availability and specialty details</Text>
          <Text style={listItem}>• Set up your payment preferences</Text>
          <Text style={listItem}>• Review platform policies and HIPAA compliance guidelines</Text>
          <Text style={listItem}>• Start accepting client bookings</Text>

          <Text style={text}>
            If you have any questions or need assistance getting started, please do not hesitate to reach out to our support team.
          </Text>

          <Text style={footer}>
            Best regards,<br />
            The {appName} Team
          </Text>

          <Text style={footerSmall}>
            This email was sent to you because you applied to join {appName} as a therapist.
          </Text>
        </Container>
      </Body>
    </Html>);
};
export default TherapistApprovedEmail;
const main = {
    backgroundColor: '#f6f9fc',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};
const container = {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    padding: '20px 0 48px',
    marginBottom: '64px',
    maxWidth: '600px',
};
const h1 = {
    color: '#4f46e5',
    fontSize: '32px',
    fontWeight: 'bold',
    margin: '40px 0',
    padding: '0 40px',
    textAlign: 'center',
};
const text = {
    color: '#374151',
    fontSize: '16px',
    lineHeight: '26px',
    margin: '16px 40px',
};
const listItem = {
    color: '#374151',
    fontSize: '16px',
    lineHeight: '26px',
    margin: '8px 40px',
    paddingLeft: '20px',
};
const buttonContainer = {
    padding: '27px 40px 27px',
    textAlign: 'center',
};
const button = {
    backgroundColor: '#4f46e5',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 'bold',
    textDecoration: 'none',
    textAlign: 'center',
    display: 'block',
    padding: '12px 24px',
};
const footer = {
    color: '#6b7280',
    fontSize: '14px',
    lineHeight: '24px',
    margin: '32px 40px 16px',
};
const footerSmall = {
    color: '#9ca3af',
    fontSize: '12px',
    lineHeight: '20px',
    margin: '0 40px',
};
