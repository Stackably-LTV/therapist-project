import { Body, Container, Head, Heading, Html, Link, Preview, Section, Text, } from '@react-email/components';
import * as React from 'react';
export const TherapistRejectedEmail = ({ therapistName = 'Dr. Smith', supportEmail = 'support@psychlink.pro', appName = 'Psychlink.pro', reapplyUrl = 'https://example.com/login?mode=signup&', reason = null, }) => {
    return (<Html>
      <Head />
      <Preview>Update on your {appName} application</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Application Status Update</Heading>
          
          <Text style={text}>Hi {therapistName},</Text>
          
          <Text style={text}>
            Thank you for your interest in joining {appName}. After careful review of your application, we regret to inform you that we are unable to approve your therapist account at this time.
          </Text>

          {reason ? (<Section style={reasonSection}>
              <Text style={reasonLabel}>Reason for rejection:</Text>
              <Text style={reasonText}>{reason}</Text>
            </Section>) : (<>
              <Text style={text}>
                This decision may be based on:
              </Text>

              <Text style={listItem}>• Incomplete or unclear credential documentation</Text>
              <Text style={listItem}>• License verification requirements</Text>
              <Text style={listItem}>• Current platform capacity in your specialty area</Text>
              <Text style={listItem}>• Other administrative requirements</Text>
            </>)}

          <Text style={text}>
            If you believe this decision was made in error or if you would like to reapply after addressing any concerns, please contact our support team at{' '}
            <Link href={`mailto:${supportEmail}`} style={link}>
              {supportEmail}
            </Link>
            {' '}or submit a new application{' '}
            <Link href={reapplyUrl} style={link}>
              here
            </Link>
          </Text>

          <Text style={text}>
            We appreciate your interest in {appName} and wish you the best in your professional endeavors.
          </Text>

          <Text style={footer}>
            Sincerely,<br />
            The {appName} Team
          </Text>

          <Text style={footerSmall}>
            This email was sent to you because you submitted an application to join {appName}.
          </Text>
        </Container>
      </Body>
    </Html>);
};
export default TherapistRejectedEmail;
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
    color: '#1f2937',
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
const link = {
    color: '#4f46e5',
    textDecoration: 'underline',
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
const reasonSection = {
    backgroundColor: '#fef3c7',
    border: '1px solid #fcd34d',
    borderRadius: '6px',
    margin: '24px 40px',
    padding: '16px',
};
const reasonLabel = {
    color: '#78350f',
    fontSize: '14px',
    fontWeight: 'bold',
    margin: '0 0 8px 0',
};
const reasonText = {
    color: '#92400e',
    fontSize: '14px',
    lineHeight: '20px',
    margin: '0',
};
