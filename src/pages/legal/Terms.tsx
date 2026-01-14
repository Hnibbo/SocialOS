import { motion } from "framer-motion";

export default function Terms() {
    return (
        <div className="min-h-screen bg-black text-white p-8 pb-32">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto"
            >
                <h1 className="text-5xl font-black mb-8">Terms of Service</h1>
                <p className="text-gray-400 mb-4">Effective Date: January 1, 2026</p>

                <div className="prose prose-invert prose-lg max-w-4xl">
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
                        <p>
                            Welcome to <strong>Hup</strong>. By accessing and using our Social OS, you agree to be bound by these Terms of Service.
                            Hup is not an application—it is a real-time social operating system for human life, designed to eliminate boredom and facilitate real-world connection.
                        </p>

                        <h2 className="text-2xl font-bold text-white mb-4">2. Eligibility</h2>
                        <p>
                            <strong>Age Requirement</strong>: You must be at least 18 years old to use Hup. By creating an account, you warrant that you meet this age requirement.
                        </p>

                        <h2 className="text-2xl font-bold text-white mb-4">3. Account Creation</h2>
                        <p>
                            When you create an account, you agree to provide accurate, current, and complete information. Hup reserves the right to suspend or terminate accounts providing false or misleading information.
                        </p>

                        <h2 className="text-2xl font-bold text-white mb-4">4. User Conduct</h2>
                        <ul className="list-disc pl-5 space-y-3 text-gray-300">
                            <li><strong>Free Speech</strong>: Users prioritize free speech but strictly prohibit illegal activities, harassment, and doxxing.</li>
                            <li><strong>No Impersonation</strong>: Impersonating others or using fake accounts is prohibited.</li>
                            <li><strong>Privacy Respect</strong>: Users must not attempt to bypass privacy settings or access features without proper consent.</li>
                            <li><strong>Real-World Safety</strong>: Users must not use Hup to facilitate or plan illegal acts. All activity can and will be monitored.</li>
                            <li><strong>Consensual Interactions</strong>: All interactions should be mutually consensual. Coercion or manipulation is prohibited.</li>
                        </ul>

                        <h2 className="text-2xl font-bold text-white mb-4">5. HUP Tokens</h2>
                        <p>
                            HUP Tokens are utility tokens for use within the platform. They do not represent equity, securities, or any financial instrument. All token purchases are final and non-refundable unless required by law.
                        </p>

                        <h2 className="text-2xl font-bold text-white mb-4">6. Content & Activities</h2>
                        <ul className="list-disc pl-5 space-y-3 text-gray-300">
                            <li><strong>User-Generated</strong>: Users are responsible for all content they create. Hup does not pre-screen or pre-approve user content except as required by law.</li>
                            <li><strong>Third-Party Content</strong>: Hup may host or curate third-party content. Users must respect all intellectual property rights.</li>
                            <li><strong>Time Decay</strong>: All time-limited content (moment drops, activities, proximity rooms) will automatically disappear after their duration expires.</li>
                        </ul>

                        <h2 className="text-2xl font-bold text-white mb-4">7. Proximity Features</h2>
                        <p>
                            Hup provides location-based features for real-world connection. These features are <strong>opt-in</strong> and users have complete control over their visibility.
                        </p>

                        <h2 className="text-xl font-bold text-white mb-4">8. Map Presence</h2>
                        <p>
                            User presence on the map is always opt-in. You must manually enable your presence to be visible to others. Presence data includes real-time location and availability status only.
                        </p>

                        <h2 className="text-2xl font-bold text-white mb-4">9. Groups & Activities</h2>
                        <p>
                            Groups and activities are first-class entities. Users can join or leave freely. Activity hosts have control over their events and can remove disruptive participants.
                        </p>

                        <h2 className="text-2xl font-bold text-white mb-4">10. Dating & Connections</h2>
                        <p>
                            The dating system is <strong>optional</strong>. Users can choose to participate or opt out entirely. All dating features are consent-gated and respect user preferences.
                        </p>

                        <h2 className="text-2xl font-bold text-white mb-4">11. Safety Features</h2>
                        <p>
                            <strong>Panic Mode</strong>: Users can activate Panic Mode to instantly become invisible to everyone. This is an emergency feature for personal safety.
                        </p>
                        <ul className="list-disc pl-5 space-y-3 text-gray-300">
                            <li><strong>Anti-Stalking</strong>: Hup implements measures to prevent unwanted following and tracking.</li>
                            <li><strong>Reporting</strong>: Users can report safety concerns through multiple channels.</li>
                        </ul>

                        <h2 className="text-2xl font-bold text-white mb-4">12. Intellectual Property</h2>
                        <p>
                            All content, features, and code created for Hup is proprietary intellectual property. Users agree not to reproduce, distribute, or create derivative works without explicit permission.
                        </p>

                        <h2 className="text-2xl font-bold text-white mb-4">13. Liability Limitation</h2>
                        <p>
                            Hup is provided "as is" and without warranty. To the maximum extent permitted by law, Hup and its creators, suppliers, and licensors shall not be liable for any direct, indirect, incidental, special, or consequential damages.
                        </p>

                        <h2 className="text-2xl font-bold text-white mb-4">14. Indemnification</h2>
                        <p>
                            Hup reserves the right, at its sole discretion, to suspend, terminate, or restrict access to the platform without notice.
                        </p>

                        <h2 className="text-2xl font-bold text-white mb-4">15. Modifications to Terms</h2>
                        <p>
                            Hup may update these Terms of Service at any time. Continued use of the platform after modifications constitutes acceptance of the updated terms.
                        </p>

                        <h2 className="text-2xl font-bold text-white mb-4">16. Governing Law</h2>
                        <p>
                            These Terms of Service shall be governed by and construed in accordance with the laws of [Jurisdiction]. Any provisions found to be unenforceable shall be automatically modified to the minimum extent necessary to comply with applicable law.
                        </p>

                        <h2 className="text-2xl font-bold text-white mb-4">17. Severability</h2>
                        <p>
                            If any provision of these Terms is deemed unenforceable or invalid, the remaining provisions shall remain in full force and effect.
                        </p>

                        <h2 className="text-2xl font-bold text-white mb-4">18. Termination</h2>
                        <p>
                            Your account and access to Hup may be terminated at any time, with or without cause. Hup shall have no obligation to retain any user data or content after termination.
                        </p>

                        <h2 className="text-2xl font-bold text-white mb-4">19. Dispute Resolution</h2>
                        <p>
                            Any disputes arising from these Terms shall be resolved through Hup's internal dispute resolution process. If you are not satisfied with the resolution, you may seek other remedies as permitted by law.
                        </p>

                        <h2 className="text-2xl font-bold text-white mb-4">20. Entire Agreement</h2>
                        <p>
                            By using Hup, you acknowledge that you have read, understood, and agreed to these Terms of Service in their entirety. These Terms constitute the entire agreement between you and Hup.
                        </p>

                        <h2 className="text-2xl font-bold text-white mb-4">21. Contact</h2>
                        <p>
                            For questions or support regarding these Terms, please contact Hup through our support channels.
                        </p>
                </section>
            </div>
            </motion.div>
        </div>
    );
}
