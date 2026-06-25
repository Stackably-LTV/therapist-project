import { Body, Container, Head, Heading, Html, Preview, Section, Text, Button, } from '@react-email/components';
import * as React from 'react';
export const MessageNotificationEmail = ({ recipientName = 'User', senderName = 'Someone', messagePreview = 'You have a new message', chatUrl = 'https://example.com/chat', appName = 'Psychlink.pro', settingsUrl = 'https://example.com/settings', }) => {
    return (<Html>
      <Head />
      <Preview>New message from {senderName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>New Message</Heading>
          
          <Text style={text}>Hi {recipientName},</Text>
          
          <Text style={text}>
            You have a new message from <strong>{senderName}</strong>:
          </Text>

          <Section style={messageBox}>
            <Text style={messageText}>{messagePreview}</Text>
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href={chatUrl}>
              View Message
            </Button>
          </Section>

          <Text style={footer}>
            You&apos;re receiving this email because you have notifications enabled for new messages on {appName}.
          </Text>

          <Text style={footerSmall}>
            To manage your notification preferences, visit your{' '}
            <a href={settingsUrl} style={link}>
              account settings
            </a>
            .
          </Text>
        </Container>
      </Body>
    </Html>);
};
export default MessageNotificationEmail;
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
    fontSize: '28px',
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
const messageBox = {
    backgroundColor: '#f3f4f6',
    borderLeft: '4px solid #4f46e5',
    padding: '16px 20px',
    margin: '24px 40px',
    borderRadius: '4px',
};
const messageText = {
    color: '#1f2937',
    fontSize: '15px',
    lineHeight: '24px',
    margin: 0,
    fontStyle: 'italic',
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
const link = {
    color: '#4f46e5',
    textDecoration: 'underline',
};
