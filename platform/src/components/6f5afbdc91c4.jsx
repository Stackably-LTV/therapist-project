import { Body, Container, Head, Heading, Hr, Html, Preview, Section, Text, } from '@react-email/components';
import * as React from 'react';
export const AppointmentReminderEmail = ({ therapistName, bodyHtml, subjectPreview, appName = 'PsycheConnect', supportEmail = 'support@psychlink.pro', }) => {
    return (<Html>
      <Head />
      <Preview>{subjectPreview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerTitle}>{appName}</Heading>
            <Text style={headerSubtitle}>Appointment reminder</Text>
          </Section>

          <Section style={content}>
            <div dangerouslySetInnerHTML={{ __html: bodyHtml }} style={bodyText}/>
          </Section>

          <Hr style={hr}/>
          <Section style={footer}>
            <Text style={footerText}>
              Sent on behalf of {therapistName}. Questions? Contact {supportEmail}.
            </Text>
            <Text style={footerBrand}>{appName}</Text>
          </Section>
        </Container>
      </Body>
    </Html>);
};
export default AppointmentReminderEmail;
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
    padding: '32px 20px',
    textAlign: 'center',
    borderRadius: '10px 10px 0 0',
};
const headerTitle = {
    color: '#fff',
    margin: 0,
    fontSize: '24px',
};
const headerSubtitle = {
    color: '#f0f0f0',
    margin: '8px 0 0 0',
    fontSize: '14px',
};
const content = {
    backgroundColor: '#ffffff',
    padding: '32px 30px',
    border: '1px solid #e0e0e0',
    borderTop: 'none',
    borderRadius: '0 0 10px 10px',
};
const bodyText = {
    fontSize: '15px',
    color: '#444',
    lineHeight: 1.6,
};
const hr = { borderColor: '#e0e0e0', margin: '20px 0' };
const footer = {
    textAlign: 'center',
    padding: '12px',
};
const footerText = {
    color: '#999',
    fontSize: '12px',
    margin: '0 0 6px 0',
};
const footerBrand = {
    color: '#667eea',
    margin: 0,
    fontSize: '12px',
};
