
import AppHeaderSuspenseWrapper from "@/components/AppHeaderSuspenseWrapper";
import Link from "next/link";

export default function Page() {
  return (
    <div className="min-h-[100svh] flex flex-col items-center w-full bg-[var(--bg)]">
      <AppHeaderSuspenseWrapper />
      <main className="flex flex-col justify-center items-start w-full flex-1 max-w-2xl mx-auto pt-16 pb-12 gap-4 px-2 md:px-0">
        <Link href="/" className="text-blue-500 hover:cursor-pointer hover:underline">⬅ Back to main</Link>
        <h1 className="text-2xl font-bold">Privacy Policy</h1>
        <span className="italic text-sm">Last updated: August 25, 2025</span>

        <p>Your privacy is important to us. This Privacy Policy explains what information we collect, how we use it, and what rights you have regarding your data when you use Traduxo app.</p>

        <section>
          <h2 className="text-xl font-bold mb-2">1. Information We Collect</h2>
          <p>When you use our app, we collect the following data:</p>
          <ul className="pl-4 py-2">
            <li className="pb-2">
              <h3 className="font-bold">User account data</h3>
              <ul className="pl-8 list-disc">
                <li>Email address</li>
                <li>Preferred explanation language</li>
              </ul>
            </li>
            <li className="pb-2">
              <h3 className="font-bold">Translation history</h3>
              <ul className="pl-8 list-disc">
                <li>Original text</li>
                <li>Translations</li>
                <li>Alternative translations</li>
                <li>Input language</li>
                <li>Output language</li>
                <li>Date and time of creation</li>
              </ul>
            </li>
            <li>
              <h3 className="font-bold">Favorites</h3>
              <ul className="pl-8 list-disc">
                <li>Original text</li>
                <li>Translations</li>
                <li>Alternative translations</li>
                <li>Input language</li>
                <li>Output language</li>
                <li>Date and time of creation</li>
              </ul>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2">2. How We Use Your Information</h2>
          <p>We use the collected information to:</p>
          <ul className="list-disc pl-8 pt-1">
            <li>Provide and improve translation services</li>
            <li>Save your history and favorites for your personal use</li>
            <li>Improve the AI-generated suggestions (avoid repetitions)</li>
            <li>Communicate with you (e.g., account support, updates)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2">3. Data Sharing and Disclosure</h2>

          <p>We do not sell or share your personal information with third parties for marketing purposes.</p>
          <p>We may share data only in the following cases:</p>

          <ul className="pl-4 py-2">
            <li className="pb-2">
              <h3 className="font-bold">With service providers:</h3>
              <ul className="list-disc pl-8">
                <li>We use trusted third-party providers to operate our app (e.g., hosting, authentication, database).</li>
              </ul>
            </li>
            <li className="pb-2">
              <h3 className="font-bold">With Google Gemini</h3>
              <ul className="list-disc pl-8">
                <li>To provide translations and explanations, your inputs (such as text you submit for translation) are sent to Google Gemini, an AI service provided by Google.</li>
                <li>According to Google’s policies, submitted data may be used to improve Google’s AI models.</li>
                <li>We do not control how Google uses this data, but you can review their privacy policy&nbsp;
                  <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:cursor-pointer hover:underline">here</a>.
                </li>

              </ul>
            </li>
            <li>
              <h3 className="font-bold">If required by law <span className="font-normal">or to protect our legal rights.</span></h3>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2">4. Data Retention and Deletion</h2>
          <ul>
            <li>Your data (history, favorites, account info) is stored securely while you maintain an account.</li>
            <li>You may request deletion of your account and all associated data at any time by using « delete account » button in the user menu or by contacting us at&nbsp;
              <a href="mailto:support@traduxo.app" className="text-blue-500 hover:cursor-pointer hover:underline">support@traduxo.app</a>.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2">5. Security</h2>
          <p>We take appropriate technical and organizational measures to protect your data from unauthorized access, loss, or misuse. However, no method of electronic transmission or storage is 100% secure.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2">6. Your Rights</h2>
          <p>Depending on your location, you may have the right to:</p>
          <ul className="list-disc pl-8 pt-1">
            <li>Access the data we hold about you</li>
            <li>Correct or update your information</li>
            <li>Request deletion of your account and data</li>
            <li>Opt-out of certain data uses</li>
            <p>{'> '}&nbsp;To exercise these rights, please contact us at <a href="mailto:support@traduxo.app" className="text-blue-500 hover:cursor-pointer hover:underline">support@traduxo.app</a>.</p>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2">7. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. Any changes will be posted here with the updated date.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2">8. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us at:</p>
          <a href="mailto:support@traduxo.app" className="text-blue-500 hover:cursor-pointer hover:underline">support@traduxo.app</a>
        </section>
      </main>
    </div>
  )
}
