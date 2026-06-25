import ContactForm from '@/components/b5b29b306e40';
import { Mail, MapPin, Phone, Clock, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/2795b661f080';
export default function ContactPage() {
    return (<div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              We&apos;re Here to Help
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed mb-4">
              Have questions about our services, need technical support, or want to learn more? 
              Our team is ready to assist you every step of the way.
            </p>
            <p className="text-lg text-gray-500">
              We typically respond within 24 hours during business days.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Contact Information Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center hover:border-gray-300 transition-colors">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-gray-700"/>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Us</h3>
            <p className="text-gray-600 text-sm mb-4">
              Send us an email anytime
            </p>
            <a href="mailto:support@psychlink.pro" className="text-primary hover:underline font-medium inline-block">
              support@psychlink.pro
            </a>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center hover:border-gray-300 transition-colors">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Phone className="w-8 h-8 text-gray-700"/>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Call Us</h3>
            <p className="text-gray-600 text-sm mb-4">
              Mon-Fri from 8am to 6pm EST
            </p>
            <a href="tel:+1234567890" className="text-primary hover:underline font-medium inline-block">
              +1 (234) 567-890
            </a>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center hover:border-gray-300 transition-colors">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-gray-700"/>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Business Hours</h3>
            <div className="text-gray-600 text-sm space-y-1">
              <p>Monday - Friday: 8am - 6pm EST</p>
              <p>Saturday: 9am - 4pm EST</p>
              <p>Sunday: Closed</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center hover:border-gray-300 transition-colors">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-gray-700"/>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Office Location</h3>
            <div className="text-gray-600 text-sm space-y-1">
              <p>123 Therapy Street</p>
              <p>Suite 456</p>
              <p>New York, NY 10001</p>
            </div>
          </div>
        </div>

        {/* Contact Form Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 lg:p-8 mb-16">
          <div className="max-w-xl mx-auto">
            <h2 className="text-xl font-semibold text-gray-900 mb-1">
              Send us a Message
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              We&apos;ll respond within 24 hours
            </p>
            <ContactForm />
          </div>
        </div>

        {/* Emergency Help Section */}
        <div className="bg-gray-900 text-white rounded-lg p-10 lg:p-12 mb-16">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-16 h-16 bg-white/10 rounded-lg flex items-center justify-center mx-auto mb-6">
              <HelpCircle className="w-8 h-8"/>
            </div>
            <h2 className="text-3xl font-bold mb-4">
              Need Immediate Help?
            </h2>
            <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
              If you&apos;re experiencing a mental health emergency, please contact emergency services immediately. 
              These resources are available 24/7 to provide immediate support.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild variant="outline" className="bg-white text-gray-900 hover:bg-gray-100 border-0 h-12 px-8 text-base font-semibold">
                <a href="tel:911">Call 911</a>
              </Button>
              <Button asChild variant="outline" className="bg-white text-gray-900 hover:bg-gray-100 border-0 h-12 px-8 text-base font-semibold">
                <a href="tel:988">988 Suicide & Crisis Lifeline</a>
              </Button>
              <Button asChild variant="outline" className="bg-transparent text-white border-2 border-white hover:bg-white hover:text-gray-900 h-12 px-8 text-base font-semibold">
                <Link href="/marketplace">Find a Therapist</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-8 lg:p-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Quick answers to common questions about our platform and services.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                How do I book a session?
              </h3>
              <p className="text-gray-600">
                Browse our therapist directory, select a therapist that fits your needs, and choose an available time slot to book your session. You can also use our matching system to find therapists based on your preferences.
              </p>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Is my information secure?
              </h3>
              <p className="text-gray-600">
                Yes, we use bank-level encryption and are HIPAA compliant. Your privacy and security are our top priorities. All sessions are encrypted end-to-end.
              </p>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Do you accept insurance?
              </h3>
              <p className="text-gray-600">
                Many of our therapists accept various insurance plans. Check individual therapist profiles for specific insurance information. We also offer affordable self-pay rates.
              </p>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I cancel or reschedule?
              </h3>
              <p className="text-gray-600">
                Yes, you can cancel or reschedule sessions up to 24 hours before your appointment without any fees. Simply go to your dashboard and manage your appointments.
              </p>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What if I don&apos;t like my therapist?
              </h3>
              <p className="text-gray-600">
                We want you to find the right fit. If you&apos;re not satisfied with your therapist, you can easily switch to another therapist at any time. Our support team is here to help.
              </p>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Are sessions confidential?
              </h3>
              <p className="text-gray-600">
                Absolutely. All sessions are completely confidential and protected by HIPAA regulations. Your therapist is bound by professional confidentiality standards.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>);
}
