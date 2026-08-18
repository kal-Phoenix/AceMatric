import { FileText, ArrowLeft } from 'lucide-react';

interface LegalPageProps {
  onBack?: () => void;
}

export default function TermsOfServiceView({ onBack }: LegalPageProps) {
  return (
    <div className="min-h-[70vh] max-w-3xl mx-auto py-8 space-y-8">
      <div className="space-y-4">
        {onBack && (
          <button onClick={onBack} className="flex items-center gap-2 text-xs text-slate-400 hover:text-teal-400 font-bold transition-colors cursor-pointer">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
        )}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/15 flex items-center justify-center border border-teal-500/20">
            <FileText className="w-5 h-5 text-teal-400" />
          </div>
          <h1 className="text-2xl font-black text-white">Terms of Service</h1>
        </div>
        <p className="text-xs text-slate-500">Last updated: July 22, 2026</p>
      </div>

      <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-lg font-black text-white">1. Acceptance of Terms</h2>
          <p>By accessing or using AceMatric, you agree to be bound by these Terms of Service. If you do not agree, do not use the platform.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-white">2. Description of Service</h2>
          <p>AceMatric is an educational platform providing practice question banks, timed mock exam simulators, AI-powered concept explanations, curriculum video lessons, and collaborative study tools for Ethiopian Grade 12 students preparing for university entrance exams.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-white">3. User Accounts</h2>
          <p>You are responsible for maintaining the confidentiality of your account credentials. You must provide accurate information during registration. You are responsible for all activities that occur under your account.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-white">4. Acceptable Use</h2>
          <p>You agree not to misuse the platform, attempt to access other users' accounts, use automated tools to scrape content, or engage in any activity that disrupts the service. AI features must be used for educational purposes only.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-white">5. Intellectual Property</h2>
          <p>All content on AceMatric, including questions, explanations, notes, and software, is owned by AceMatric EdTech or its licensors. You may not reproduce, distribute, or create derivative works without explicit permission.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-white">6. Premium Services</h2>
          <p>AceMatric offers premium features through paid subscriptions. Premium features are subject to additional terms presented at the time of purchase. Refund requests are handled on a case-by-case basis.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-white">7. AI-Generated Content</h2>
          <p>AI-generated explanations and study plans are provided as supplementary educational aids. They should not be treated as definitive academic advice. Always verify critical information with your teachers or official curriculum materials.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-white">8. Limitation of Liability</h2>
          <p>AceMatric is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the platform. We do not guarantee specific exam results or university placements.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-white">9. Termination</h2>
          <p>We reserve the right to suspend or terminate your account for violations of these terms. You may delete your account at any time through your profile settings.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-white">10. Governing Law</h2>
          <p>These terms are governed by the laws of the Federal Democratic Republic of Ethiopia. Any disputes shall be resolved in the courts of Addis Ababa.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-white">11. Changes to Terms</h2>
          <p>We may update these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms.</p>
        </section>
      </div>
    </div>
  );
}
