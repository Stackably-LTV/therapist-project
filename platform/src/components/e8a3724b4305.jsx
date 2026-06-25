import { Button } from '@/components/2795b661f080';
import { Heart, Shield, Users, Award, Clock, Lock, Target, Eye, CheckCircle2, TrendingUp, Calendar, Star } from 'lucide-react';
import Link from 'next/link';
export default function AboutPage() {
    return (<div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              About Psychlink
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              We&apos;re on a mission to make quality mental health care accessible, 
              affordable, and convenient for everyone. Founded with the belief that 
              everyone deserves support, we&apos;ve built a platform that connects you 
              with licensed professionals who truly care.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* Our Story Section */}
        <div className="mb-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Story</h2>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  Psychlink was born from a simple observation: mental health care shouldn&apos;t be 
                  complicated, expensive, or hard to access. In a world where millions struggle with 
                  mental health challenges, we saw a need for a platform that removes barriers and 
                  makes professional help truly accessible.
                </p>
                <p>
                  Founded by a team of healthcare professionals and technology experts, we&apos;ve built 
                  a platform that combines the best of both worlds: the expertise of licensed mental 
                  health professionals with the convenience of modern technology.
                </p>
                <p>
                  Today, we&apos;re proud to serve thousands of clients and work with hundreds of 
                  licensed therapists who share our commitment to making mental health care 
                  accessible to everyone.
                </p>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Key Milestones</h3>
              <div className="space-y-6">
                {[
            { year: "2020", event: "Platform launched with 50 therapists" },
            { year: "2021", event: "Reached 1,000 active clients" },
            { year: "2022", event: "Expanded to 200+ licensed professionals" },
            { year: "2023", event: "Achieved HIPAA compliance certification" },
            { year: "2024", event: "Serving 10,000+ clients nationwide" },
        ].map((milestone, index) => (<div key={index} className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-6 h-6 text-gray-700"/>
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 mb-1">{milestone.year}</div>
                      <div className="text-gray-600">{milestone.event}</div>
                    </div>
                  </div>))}
              </div>
            </div>
          </div>
        </div>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white border border-gray-200 rounded-lg p-8">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
              <Target className="w-6 h-6 text-gray-700"/>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-gray-700 leading-relaxed">
              To make quality mental health care accessible, affordable, and convenient for everyone. 
              We break down barriers by providing a secure, convenient, and professional space where 
              clients can connect with licensed therapists from the comfort of their own homes.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-8">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
              <Eye className="w-6 h-6 text-gray-700"/>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h2>
            <p className="text-gray-700 leading-relaxed">
              To become the most trusted and accessible mental health platform, where anyone can 
              find the support they need, when they need it. We envision a future where mental 
              health care is as normal and accessible as physical health care.
            </p>
          </div>
        </div>

        {/* Core Values */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Core Values</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
            {
                icon: Heart,
                title: "Compassionate Care",
                description: "Every therapist on our platform is committed to providing empathetic, personalized support tailored to your unique needs.",
            },
            {
                icon: Shield,
                title: "Security & Privacy",
                description: "HIPAA-compliant platform with end-to-end encryption. Your privacy and security are our top priorities.",
            },
            {
                icon: Users,
                title: "Accessibility",
                description: "Connect with therapists anytime, anywhere. We believe mental health care should be convenient and accessible to all.",
            },
            {
                icon: Award,
                title: "Excellence",
                description: "We maintain the highest standards by working only with licensed, verified professionals with proven expertise.",
            },
            {
                icon: CheckCircle2,
                title: "Transparency",
                description: "Clear pricing, honest communication, and straightforward processes. No hidden fees or surprises.",
            },
            {
                icon: TrendingUp,
                title: "Continuous Improvement",
                description: "We improve the platform using therapist feedback and client outcomes to strengthen care quality and reliability.",
            },
        ].map((value) => {
            const Icon = value.icon;
            return (<div key={value.title} className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-gray-700"/>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {value.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {value.description}
                  </p>
                </div>);
        })}
          </div>
        </div>

        {/* Why Choose Us */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose Psychlink?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We&apos;ve built a platform that puts your needs first
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
            {
                icon: Award,
                title: "Licensed Professionals",
                description: "Licensed clinicians with years of specialized experience.",
            },
            {
                icon: Clock,
                title: "Flexible Scheduling",
                description: "Book sessions that fit your schedule with easy online booking. Evening and weekend availability makes care accessible.",
            },
            {
                icon: Lock,
                title: "Complete Privacy",
                description: "Your sessions and personal information are protected with bank-level encryption. HIPAA-compliant and secure.",
            },
            {
                icon: Heart,
                title: "Personalized Matching",
                description: "Find therapists who specialize in your specific needs. Our matching system helps you find the perfect fit.",
            },
            {
                icon: Users,
                title: "Ongoing Support",
                description: "Access to secure messaging, progress tracking, and continuous care between sessions. You&apos;re never alone.",
            },
            {
                icon: Shield,
                title: "Insurance Accepted",
                description: "Many of our therapists accept insurance, and we offer affordable self-pay rates. Transparent pricing, no surprises.",
            },
        ].map((feature) => {
            const Icon = feature.icon;
            return (<div key={feature.title} className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-gray-700"/>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>);
        })}
          </div>
        </div>

        {/* Our Team Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Team</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              A dedicated group of professionals committed to your mental health
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
            {
                name: "Clinical Team",
                role: "Licensed Therapists",
                description: "Our network of 500+ licensed mental health professionals includes clinicians, psychologists, and licensed clinical social workers.",
            },
            {
                name: "Technology Team",
                role: "Platform Development",
                description: "Our engineers and designers work tirelessly to create a secure, user-friendly platform that makes therapy accessible.",
            },
            {
                name: "Support Team",
                role: "Client Services",
                description: "Our support team is available 24/7 to help you with any questions, technical issues, or concerns you may have.",
            },
        ].map((team) => (<div key={team.name} className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-700"/>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{team.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{team.role}</p>
                <p className="text-gray-600 text-sm">{team.description}</p>
              </div>))}
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-gray-900 rounded-lg p-12 mb-16 text-white">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">By The Numbers</h2>
            <p className="text-gray-300">Our impact in numbers</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold mb-2">500+</div>
              <div className="text-gray-300">Licensed Therapists</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">10,000+</div>
              <div className="text-gray-300">Successful Sessions</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">98%</div>
              <div className="text-gray-300">Client Satisfaction</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">4.9</div>
              <div className="text-gray-300 flex items-center justify-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400"/>
                Average Rating
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Join thousands of individuals who have found support, healing, and growth through 
            our platform. Your path to better mental health starts here.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/login?mode=signup&">
                Get Started Today
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/marketplace">
                Browse Therapists
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>);
}
