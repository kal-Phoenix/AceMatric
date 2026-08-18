import { ShieldCheck, ArrowLeft } from 'lucide-react';

interface LegalPageProps {
  onBack?: () => void;
}

export default function PrivacyPolicyView({ onBack }: LegalPageProps) {
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
            <ShieldCheck className="w-5 h-5 text-teal-400" />
          </div>
          <h1 className="text-2xl font-black text-white">Privacy Policy</h1>
        </div>
        <p className="text-xs text-slate-500">Last updated: July 22, 2026</p>
      </div>

      <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-lg font-black text-white">1. Information We Collect</h2>
          <p>We collect information you provide directly, including your name, email address, academic stream, study preferences, and usage data such as quiz scores, study sessions, and practice history.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-white">2. How We Use Your Information</h2>
          <p>Your information is used to provide and improve the AceMatric platform, personalize your study experience, generate AI-powered explanations and study plans, track your academic progress, and send important account-related notifications.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-white">3. Data Storage & Security</h2>
          <p>Your data is stored securely using Supabase cloud infrastructure with industry-standard encryption. We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-white">4. AI Features</h2>
          <p>AceMatric uses Google Gemini AI models to provide concept explanations, study plans, and tutoring. When you use AI features, your queries are processed by Google's AI services. We do not use your data to train AI models.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-white">5. Data Sharing</h2>
          <p>We do not sell or rent your personal information to third parties. We may share anonymized, aggregated data for research or analytics purposes. We may share information when required by law or to protect the safety of our users.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-white">6. Your Rights</h2>
          <p>You have the right to access, correct, or delete your personal data. You can export your data or request account deletion at any time through your profile settings or by contacting us.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-white">7. Cookies & Local Storage</h2>
          <p>AceMatric uses browser local storage to maintain your session, preferences, and offline data. We do not use third-party tracking cookies.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-white">8. Children's Privacy</h2>
          <p>AceMatric is designed for students preparing for university entrance exams. We do not knowingly collect personal information from children under 13. If you are under 13, please use the platform with parental consent.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-white">9. Changes to This Policy</h2>
          <p>We may update this privacy policy from time to time. We will notify you of any significant changes by posting the new policy on this page and updating the "Last updated" date.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-white">10. Contact Us</h2>
          <p>If you have questions about this privacy policy, please contact us through the Contact Us page in the application.</p>
        </section>
      </div>
    </div>
  );
}
