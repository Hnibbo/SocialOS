import { motion } from "framer-motion";
import { Shield, Download, Trash2, Eye, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const rights = [
  {
    icon: Eye,
    title: "Right to Access",
    description: "You can request a copy of all personal data we hold about you at any time.",
  },
  {
    icon: Download,
    title: "Right to Portability",
    description: "Receive your data in a structured, commonly used, machine-readable format.",
  },
  {
    icon: Trash2,
    title: "Right to Erasure",
    description: "Request deletion of your personal data, also known as 'the right to be forgotten'.",
  },
  {
    icon: Lock,
    title: "Right to Restrict Processing",
    description: "Request that we limit the way we use your personal data.",
  },
];

export default function GDPR() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-6">
              GDPR <span className="text-gradient">Compliance</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              We are committed to protecting your privacy and ensuring compliance with the
              General Data Protection Regulation (GDPR).
            </p>
          </motion.div>
        </div>
      </section>

      {/* Your Rights */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Your Rights Under GDPR</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              As a user in the European Economic Area, you have specific rights regarding your personal data.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {rights.map((right, index) => (
              <motion.div
                key={right.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl bg-background border border-border text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <right.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{right.title}</h3>
                <p className="text-sm text-muted-foreground">{right.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Data Processing */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-display text-3xl font-bold mb-8 text-center">How We Process Your Data</h2>

            <div className="space-y-8">
              <div className="p-6 rounded-2xl bg-muted/30 border border-border">
                <h3 className="font-semibold text-xl mb-4">Legal Basis for Processing</h3>
                <div className="space-y-4 text-muted-foreground">
                  <p><strong>Contract Performance:</strong> Processing necessary to provide our services to you.</p>
                  <p><strong>Legitimate Interests:</strong> Processing for analytics and service improvement, balanced against your privacy rights.</p>
                  <p><strong>Consent:</strong> Marketing communications are only sent with your explicit consent.</p>
                  <p><strong>Legal Obligations:</strong> Processing required to comply with legal requirements.</p>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-muted/30 border border-border">
                <h3 className="font-semibold text-xl mb-4">Data Retention</h3>
                <p className="text-muted-foreground">
                  We retain your personal data only for as long as necessary to fulfill the purposes for which it was collected.
                  Account data is retained while your account is active and for a reasonable period afterward for legal and
                  business purposes. You can request deletion of your data at any time.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-muted/30 border border-border">
                <h3 className="font-semibold text-xl mb-4">International Data Transfers</h3>
                <p className="text-muted-foreground">
                  When we transfer data outside the EEA, we ensure appropriate safeguards are in place, including
                  Standard Contractual Clauses approved by the European Commission and adherence to the EU-U.S.
                  Data Privacy Framework.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-muted/30 border border-border">
                <h3 className="font-semibold text-xl mb-4">Data Protection Officer</h3>
                <p className="text-muted-foreground">
                  We have appointed a Data Protection Officer (DPO) to oversee our data protection practices.
                  You can contact our DPO for any privacy-related inquiries.
                </p>
                <p className="font-mono text-primary mt-2">dpo@hup.social</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Exercise Your Rights */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl font-bold mb-4">Exercise Your Rights</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            To exercise any of your GDPR rights, please contact us. We will respond to your request
            within 30 days as required by law.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="gap-2" asChild>
              <a href="mailto:privacy@hup.social">
                <Mail className="w-4 h-4" /> Contact Privacy Team
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="/dashboard/settings">Manage Data in Settings</a>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
