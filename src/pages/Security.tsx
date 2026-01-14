import { motion } from "framer-motion";
import { Shield, Lock, Eye, Server, Key, FileCheck, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const securityFeatures = [
  {
    icon: Lock,
    title: "End-to-End Encryption",
    description: "All data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption.",
  },
  {
    icon: Key,
    title: "API Key Security",
    description: "API keys are hashed and stored securely. Keys can be rotated at any time and scoped to specific permissions.",
  },
  {
    icon: Server,
    title: "Secure Infrastructure",
    description: "Our infrastructure is hosted on SOC 2 Type II certified providers with redundant systems and regular backups.",
  },
  {
    icon: Eye,
    title: "Audit Logging",
    description: "Complete audit trails of all actions, accessible through your dashboard for compliance and monitoring.",
  },
  {
    icon: FileCheck,
    title: "SOC 2 Certified",
    description: "We maintain SOC 2 Type II certification, demonstrating our commitment to security best practices.",
  },
  {
    icon: AlertTriangle,
    title: "Vulnerability Management",
    description: "Regular security assessments, penetration testing, and a responsible disclosure program.",
  },
];

const practices = [
  "Regular third-party security audits and penetration testing",
  "Bug bounty program for responsible vulnerability disclosure",
  "Continuous security monitoring and incident response",
  "Employee security training and background checks",
  "Data minimization and retention policies",
  "Multi-factor authentication available for all accounts",
  "Role-based access control (RBAC) for team management",
  "GDPR and CCPA compliance measures",
];

export default function Security() {
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
              Security at <span className="text-gradient">Hup</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Security is at the core of everything we build. We implement industry-leading
              practices to protect your data and ensure your development environment stays safe.
            </p>
            <Button size="lg" variant="outline" asChild>
              <a href="mailto:security@hup.social">Report a Vulnerability</a>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Security Features */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Security Features</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Built-in security measures to protect your code and data.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {securityFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl bg-background border border-border"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Practices */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Our Security Practices</h2>
              <p className="text-muted-foreground">
                We follow industry best practices and continuously improve our security posture.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {practices.map((practice, index) => (
                <motion.div
                  key={practice}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start gap-3 p-4 rounded-xl bg-muted/30"
                >
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{practice}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Compliance Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-8">Compliance & Certifications</h2>
          <div className="flex flex-wrap justify-center gap-8">
            <div className="p-6 rounded-2xl bg-background border border-border">
              <p className="font-bold text-xl mb-1">SOC 2</p>
              <p className="text-sm text-muted-foreground">Type II Certified</p>
            </div>
            <div className="p-6 rounded-2xl bg-background border border-border">
              <p className="font-bold text-xl mb-1">GDPR</p>
              <p className="text-sm text-muted-foreground">Compliant</p>
            </div>
            <div className="p-6 rounded-2xl bg-background border border-border">
              <p className="font-bold text-xl mb-1">CCPA</p>
              <p className="text-sm text-muted-foreground">Compliant</p>
            </div>
            <div className="p-6 rounded-2xl bg-background border border-border">
              <p className="font-bold text-xl mb-1">ISO 27001</p>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-2xl font-bold mb-4">Security Questions?</h2>
          <p className="text-muted-foreground mb-6">
            Contact our security team for any questions or to report vulnerabilities.
          </p>
          <p className="font-mono text-primary">security@hup.social</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
