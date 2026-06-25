import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text, } from '@react-email/components';
import * as React from 'react';
export const ClientConsentInviteEmail = ({ seekerName, therapistName, acceptUrl, rejectUrl, signupUrl = '#', requiresSignup = false, }) => {
    const name = seekerName?.trim() || 'there';
    const introCopy = requiresSignup ? (<>
      You are being invited to PsycheConnect and to connect with <strong>{therapistName}</strong> as
      your therapist. Create your account first, then accept the request.
    </>) : (<>
      <strong>{therapistName}</strong> invited you to connect as their client on PsycheConnect. We
      only apply this connection after your consent.
    </>);
    return (<Html>
      <Head />
      <Preview>{therapistName} requested client consent</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerTitle}>Therapist connection request</Heading>
          </Section>

          <Section style={content}>
            <Text style={text}>Hi {name},</Text>
            <Text style={text}>{introCopy}</Text>
            <Text style={subtext}>
              If you accept, your account will be linked and your therapist can schedule sessions
              with you.
            </Text>

            <Section style={buttonContainer}>
              {requiresSignup && (<Button style={buttonPrimary} href={signupUrl}>
                  Create account
                </Button>)}
              <Button style={requiresSignup ? buttonSecondary : buttonPrimary} href={acceptUrl}>
                Accept request
              </Button>
              <Button style={buttonMuted} href={rejectUrl}>
                Decline
              </Button>
            </Section>

            <Text style={footerNote}>
              If this was not expected, you can safely ignore this email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>);
};
export default ClientConsentInviteEmail;
const main = {
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#f8fafc',
    padding: '24px',
};
const container = {
    maxWidth: '620px',
    margin: '0 auto',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    overflow: 'hidden',
};
const header = {
    padding: '20px 24px',
    backgroundColor: '#eef2ff',
    borderBottom: '1px solid #e2e8f0',
};
const headerTitle = {
    margin: 0,
    fontSize: '20px',
    color: '#1e293b',
};
const content = {
    padding: '24px',
};
const text = {
    marginTop: 0,
    color: '#334155',
    fontSize: '16px',
    lineHeight: 1.6,
};
const subtext = {
    color: '#64748b',
    fontSize: '14px',
    margin: '16px 0',
};
const buttonContainer = {
    margin: '28px 0 18px 0',
};
const buttonPrimary = {
    display: 'inline-block',
    padding: '12px 18px',
    borderRadius: '8px',
    backgroundColor: '#4f46e5',
    color: '#ffffff',
    textDecoration: 'none',
    fontWeight: 600,
    marginRight: '10px',
    marginBottom: '8px',
};
const buttonSecondary = {
    display: 'inline-block',
    padding: '12px 18px',
    borderRadius: '8px',
    backgroundColor: '#0f766e',
    color: '#ffffff',
    textDecoration: 'none',
    fontWeight: 600,
    marginRight: '10px',
    marginBottom: '8px',
};
const buttonMuted = {
    display: 'inline-block',
    padding: '12px 18px',
    borderRadius: '8px',
    backgroundColor: '#e2e8f0',
    color: '#1e293b',
    textDecoration: 'none',
    fontWeight: 600,
    marginBottom: '8px',
};
const footerNote = {
    color: '#94a3b8',
    fontSize: '12px',
    marginBottom: 0,
};
