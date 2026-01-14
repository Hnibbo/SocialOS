import { motion } from "framer-motion";

export default function Privacy() {
    return (
        <div className="min-h-screen bg-black text-gray-300 p-8 pb-32">
            <div className="max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="prose prose-invert prose-lg max-w-none"
                >
                    <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
                    <p className="text-lg text-gray-400 mb-4">Data Sovereignty First. Your data belongs to you.</p>

                    <section>
                        <h2 className="text-2xl font-bold text-white mt-8 mb-4">1. Our Philosophy</h2>
                        <p className="text-gray-300">
                            At <strong>Hup</strong>, we believe your data belongs to you. Unlike legacy social networks that monetize your attention and sell your activity to advertisers, we take a different approach.
                        </p>
                        <p className="text-gray-300">
                            <strong>Transparency</strong>: We are clear about what we collect and why. You always have full visibility into your data.
                        </p>
                        <p className="text-gray-300">
                            <strong>Control</strong>: You have complete control over your data. You can export, delete, or request deletion at any time through our support channels.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mt-8 mb-4">2. Data We Collect</h2>
                        <ul className="list-disc pl-5 space-y-3 text-gray-300">
                            <li><strong>Geolocation</strong>: Used only for Live Map and 'Find Nearby' features. You can toggle this off instantly with 'Invisible Mode'. We do not track your precise movements continuously.</li>
                            <li><strong>Profile Data</strong>: Name, interests, and photos you explicitly upload. This includes avatar, bio, and social links.</li>
                            <li><strong>HUP Transactions</strong>: On-chain or database records of token usage for auditability. We do not share your financial data.</li>
                            <li><strong>Device Information</strong>: Browser type, device ID, and approximate location are logged when you use geolocation.</li>
                            <li><strong>Usage Analytics</strong>: How you interact with platform is analyzed to improve features. We do not sell this data.</li>
                            <li><strong>Cookies & Local Storage</strong>: Your preferences and some app data are stored locally for convenience. You can clear this anytime.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mt-8 mb-4">8. Updates to This Policy</h2>
                        <p className="text-gray-300">We will notify users of any material changes through:</p>
                        <ul className="list-disc pl-5 space-y-3 text-gray-300">
                            <li>Email notifications for policy updates</li>
                            <li>In-app notifications for immediate changes</li>
                            <li>Announcements in-app and on Social Grid</li>
                        </ul>
                    </section>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="fixed bottom-0 left-0 right-0 p-6 text-center w-full bg-gradient-to-t from-black via-primary/20 to-transparent"
                    >
                        <p className="text-sm text-white/60">
                            By continuing to use Hup, you agree to all terms outlined above.
                        </p>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}
