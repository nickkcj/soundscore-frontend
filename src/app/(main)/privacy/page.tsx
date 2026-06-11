import type { Metadata } from 'next';
import { Shield, Database, Share2, Trash2, Mail, Cookie, Baby, RefreshCw } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy - SoundScore',
  description: 'How SoundScore collects, uses, and protects your data.',
};

const LAST_UPDATED = 'June 11, 2026';

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="font-semibold text-foreground flex items-center">
          <Icon className="h-4 w-4 mr-2 text-wine-500" />
          {title}
        </h2>
      </div>
      <div className="px-5 py-4 text-sm leading-relaxed text-foreground/90 space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero — mesma linguagem visual da página About */}
      <div
        className="py-14 md:py-20"
        style={{
          background: `linear-gradient(to bottom right,
            #722F37 0%,
            #5e2530 60%,
            #3a1820 100%)`,
        }}
      >
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-3">
            Privacy Policy
          </h1>
          <p className="text-white/80">Last updated: {LAST_UPDATED}</p>
        </div>
      </div>

      <main className="container mx-auto max-w-3xl px-4 py-10 space-y-6">
        <p className="text-muted-foreground text-sm leading-relaxed">
          SoundScore (&quot;we&quot;, &quot;us&quot;) is a social platform for music lovers, available at{' '}
          <span className="font-medium text-foreground">soundscore.com.br</span> and as a mobile
          app. This policy explains what data we collect, why we collect it, and the choices you
          have. By using SoundScore you agree to this policy.
        </p>

        <Section icon={Database} title="What we collect">
          <ul>
            <li>
              <strong>Account information:</strong> username, email address, and a securely hashed
              password. If you sign in with Google or Spotify, we receive your basic profile
              information from those providers.
            </li>
            <li>
              <strong>Profile content:</strong> profile pictures, banner images, and bio text you
              choose to add.
            </li>
            <li>
              <strong>Activity:</strong> album reviews, ratings, comments, likes, follows, group
              memberships, group and direct messages, and listening session votes.
            </li>
            <li>
              <strong>Listening data (optional):</strong> if you connect your Spotify account, we
              periodically sync your recently played tracks (&quot;scrobbles&quot;) to power your
              library and profile features.
            </li>
            <li>
              <strong>Technical data:</strong> basic logs needed to operate and secure the service
              (such as request timestamps and error reports).
            </li>
          </ul>
        </Section>

        <Section icon={Shield} title="How we use your data">
          <ul>
            <li>To provide the service: your feed, reviews, chats, groups, and listening sessions.</li>
            <li>To show your public profile and content to other users, as the product is designed to do.</li>
            <li>To send notifications you expect (replies, likes, invites, messages).</li>
            <li>To generate AI content such as artist biographies and chatbot answers.</li>
            <li>To keep the platform safe, prevent abuse, and debug problems.</li>
          </ul>
          <p>We do not sell your personal data. We do not use your data for third-party advertising.</p>
        </Section>

        <Section icon={Share2} title="Who we share data with">
          <p>
            We rely on a small set of service providers to run SoundScore. They process data only
            to provide their service to us:
          </p>
          <ul>
            <li><strong>Amazon Web Services</strong> — application hosting and image storage.</li>
            <li><strong>Supabase</strong> — database and real-time messaging infrastructure.</li>
            <li><strong>Vercel</strong> — website hosting.</li>
            <li><strong>Spotify</strong> — music catalog data and, if you connect it, your listening history.</li>
            <li><strong>Google (Gemini)</strong> — AI features such as artist bios and the chatbot. Chatbot prompts are processed by Google to generate answers.</li>
            <li><strong>Resend</strong> — transactional emails (such as password resets).</li>
          </ul>
        </Section>

        <Section icon={Cookie} title="Cookies and local storage">
          <p>
            We use browser local storage to keep you signed in and remember preferences (such as
            theme). We do not use advertising or cross-site tracking cookies.
          </p>
        </Section>

        <Section icon={Trash2} title="Data retention and deletion">
          <p>
            Your data is kept while your account exists. You can delete your content (reviews,
            messages, images) at any time within the app. To delete your account and the personal
            data associated with it, use the account settings or contact us — we will process the
            request within 30 days.
          </p>
        </Section>

        <Section icon={Baby} title="Children">
          <p>
            SoundScore is not directed at children under 13. If you believe a child has created an
            account, contact us and we will remove it.
          </p>
        </Section>

        <Section icon={RefreshCw} title="Your rights and changes to this policy">
          <p>
            Depending on where you live (including under Brazil&apos;s LGPD and the EU&apos;s GDPR),
            you may have the right to access, correct, export, or delete your personal data, and to
            withdraw consent. Contact us to exercise these rights.
          </p>
          <p>
            We may update this policy as the product evolves. Significant changes will be announced
            in the app, and the &quot;last updated&quot; date above always reflects the current
            version.
          </p>
        </Section>

        <Section icon={Mail} title="Contact">
          <p>
            Questions or requests about your privacy:{' '}
            <a
              href="mailto:contact@soundscore.com.br"
              className="text-wine-600 dark:text-wine-300 font-medium hover:underline"
            >
              contact@soundscore.com.br
            </a>
          </p>
        </Section>
      </main>
    </div>
  );
}
