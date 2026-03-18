import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { CheckCircle, ArrowRight, User, Briefcase, Building } from 'lucide-react'
import Pricing from './Pricing'
import { useState, useEffect } from "react";

const typewriterWords = [
    "AI-Powered Workflows.",
    "Sales Pipelines.",
    "Approval Flows.",
    "Custom Automations."
];

function Typewriter() {
    const [index, setIndex] = useState(0);
    const [subIndex, setSubIndex] = useState(0);
    const [reverse, setReverse] = useState(false);

    useEffect(() => {
        if (subIndex === typewriterWords[index].length + 1 && !reverse) {
            setTimeout(() => setReverse(true), 500);
            return;
        }

        if (subIndex === 0 && reverse) {
            setReverse(false);
            setIndex((prev) => (prev + 1) % typewriterWords.length);
            return;
        }

        const timeout = setTimeout(() => {
            setSubIndex((prev) => prev + (reverse ? -1 : 1));
        }, Math.max(reverse ? 50 : subIndex === typewriterWords[index].length ? 1000 : 150, Math.random() * 100));

        return () => clearTimeout(timeout);
    }, [subIndex, index, reverse]);

    return (
        <span className="font-caveat hero-gradient text-glow min-h-[1.2rem] inline-block mt-2 md:mt-4">
            {typewriterWords[index].substring(0, subIndex)}
            <span className="animate-pulse ml-1">|</span>
        </span>
    );
}

const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 }
}

const staggerContainer = {
    animate: {
        transition: {
            staggerChildren: 0.1
        }
    }
}

export default function Landing() {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col font-sans overflow-x-hidden">
            {/* Navigation */}
            <nav className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-black shadow-lg shadow-primary/20 font-outfit">
                            FW
                        </div>
                        <span className="font-black text-xl tracking-tighter font-outfit">Flow Weaver</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link to="/auth?mode=login">
                            <Button variant="ghost" className="font-medium hover:text-primary transition-colors">
                                Sign In
                            </Button>
                        </Link>
                        <Link to="/auth?mode=register">
                            <Button className="font-medium shadow-md">Get Started</Button>
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="flex-1 flex flex-col">
                {/* Hero Section */}
                <section className="relative pt-24 pb-32 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/20 z-0 pointer-events-none" />

                    <motion.div
                        className="max-w-5xl mx-auto px-4 text-center relative z-10"
                        initial="initial"
                        animate="animate"
                        variants={staggerContainer}
                    >
                        <motion.div variants={fadeIn} className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium bg-secondary/50 text-secondary-foreground mb-8 backdrop-blur-sm border-primary/20 shadow-sm">
                            <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
                            The Ultimate Individual Workflow Automation Tool
                        </motion.div>

                        <motion.h1 variants={fadeIn} className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-[900] tracking-tight mb-8 leading-[1.2] font-outfit text-slate-900 whitespace-nowrap">
                            Automate any process with <br />
                            <Typewriter />
                        </motion.h1>

                        <motion.p variants={fadeIn} className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
                            Stop doing repetitive manual work. Use our Groq-powered AI to generate complex multi-step workflows in seconds automatically routing data to your favorite apps.
                        </motion.p>

                        <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <Link to="/auth?mode=register">
                                <Button size="lg" className="w-full sm:w-auto text-lg px-8 h-14 shadow-xl shadow-primary/20 rounded-full group">
                                    Start Orchestrating
                                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                            <p className="text-sm text-muted-foreground sm:hidden mt-2">No credit card required</p>
                        </motion.div>
                    </motion.div>
                </section>

                {/* Workflow Visualization Section */}
                <section className="py-24 bg-muted/30 border-y relative overflow-hidden">
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Rule-Based Engine</h2>
                            <p className="text-lg text-muted-foreground">Your logic, evaluated instantly by a robust individual-first architecture.</p>
                        </div>

                        <div className="relative max-w-5xl mx-auto">
                            {/* Connecting Line */}
                            <div className="absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-secondary via-primary/50 to-secondary -translate-y-1/2 hidden md:block rounded-full" />

                            <div className="grid md:grid-cols-3 gap-8 relative z-10">
                                {/* Step 1: Input */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    className="bg-card p-8 rounded-2xl border shadow-xl flex flex-col items-center text-center relative group hover:border-primary/50 transition-colors"
                                >
                                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-6 shadow-inner ring-8 ring-background">
                                        <User className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">1. Dynamic Interaction</h3>
                                    <p className="text-muted-foreground text-sm">Trigger workflows with custom forms or simple API calls tailored to your needs.</p>
                                    <div className="mt-4 px-3 py-1 bg-secondary rounded-full text-xs font-semibold">
                                        Personal Trigger
                                    </div>
                                </motion.div>

                                {/* Step 2: Rules */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.2 }}
                                    className="bg-card p-8 rounded-2xl border shadow-xl flex flex-col items-center text-center relative group hover:border-primary/50 transition-colors"
                                >
                                    <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center mb-6 shadow-inner ring-8 ring-background">
                                        <Briefcase className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">2. Smart Rule Engine</h3>
                                    <p className="text-muted-foreground text-sm">Apply custom logic—like string functions or value checks—to every execution.</p>
                                    <div className="mt-4 px-3 py-1 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 rounded-full text-xs font-semibold flex items-center gap-1">
                                        Logic: contains("urgent")
                                        <ArrowRight className="w-3 h-3" />
                                    </div>
                                </motion.div>

                                {/* Step 3: Result */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.4 }}
                                    className="bg-card p-8 rounded-2xl border shadow-xl ring-2 ring-primary/20 flex flex-col items-center text-center relative group hover:ring-primary/50 transition-all"
                                >
                                    <div className="absolute -top-3 -right-3">
                                        <span className="relative flex h-6 w-6">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-6 w-6 bg-primary border-2 border-background"></span>
                                        </span>
                                    </div>
                                    <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6 shadow-inner ring-8 ring-background">
                                        <Building className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">3. Automated Outcomes</h3>
                                    <p className="text-muted-foreground text-sm">Notifications, Webhooks, or approvals happen immediately and automatically.</p>
                                    <div className="mt-4 px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-semibold flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3" />
                                        Task Done
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Roles Highlights */}
                <section className="py-24 px-4 w-full">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold">Built for Every Kind of User</h2>
                            <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">Whether you're a developer building custom tools or a professional automating your daily tasks, Flow Weaver gives you absolute control over your workflows.</p>
                        </div>
                        <div className="grid md:grid-cols-4 gap-6">
                            <div className="bg-card p-6 rounded-2xl border transition-all hover:shadow-xl hover:-translate-y-1 duration-300">
                                <h3 className="text-xl font-bold mb-2">Developers</h3>
                                <p className="text-sm text-primary font-medium mb-4">Power Users</p>
                                <p className="text-muted-foreground leading-relaxed text-sm">
                                    Utilize webhooks, API triggers, and advanced conditional logic to connect your favorite tools and build custom micro-services.
                                </p>
                            </div>
                            <div className="bg-card p-6 rounded-2xl border transition-all hover:shadow-xl hover:-translate-y-1 duration-300 ring-1 ring-primary/10 bg-primary/5">
                                <h3 className="text-xl font-bold mb-2">Freelancers</h3>
                                <p className="text-sm text-primary font-medium mb-4">Client Management</p>
                                <p className="text-muted-foreground leading-relaxed text-sm">
                                    Automate client intake, approval processes, and project notifications to keep your individual business running smoothly.
                                </p>
                            </div>
                            <div className="bg-card p-6 rounded-2xl border transition-all hover:shadow-xl hover:-translate-y-1 duration-300">
                                <h3 className="text-xl font-bold mb-2">Creators</h3>
                                <p className="text-sm text-primary font-medium mb-4">Content Production</p>
                                <p className="text-muted-foreground leading-relaxed text-sm">
                                    Build multi-stage pipelines for content review, social media distribution, and automated feedback loops.
                                </p>
                            </div>
                            <div className="bg-card p-6 rounded-2xl border transition-all hover:shadow-xl hover:-translate-y-1 duration-300">
                                <h3 className="text-xl font-bold mb-2">Innovators</h3>
                                <p className="text-sm text-primary font-medium mb-4">Efficiency Experts</p>
                                <p className="text-muted-foreground leading-relaxed text-sm">
                                    Design bespoke internal tools for your own productivity without needing a team or complex company setup.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Pricing / Revenue Model Section */}
                <section id="pricing" className="py-24 bg-muted/30 border-t w-full">
                    <Pricing />
                </section>

                {/* Bottom CTA */}
                <section className="py-20 border-t bg-primary text-primary-foreground">
                    <div className="max-w-4xl mx-auto px-4 text-center">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to automate your world?</h2>
                        <p className="text-xl opacity-90 mb-10">Join thousands of individuals building bespoke tools through intelligent personal workflows.</p>
                        <Link to="/auth?mode=register">
                            <Button size="lg" variant="secondary" className="text-lg px-8 h-14 rounded-full text-primary hover:bg-background">
                                Create an Account
                            </Button>
                        </Link>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t bg-card py-12 px-4">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between text-muted-foreground text-sm">
                    <div className="flex items-center gap-2 mb-4 md:mb-0">
                        <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                            FW
                        </div>
                        <span className="font-semibold text-foreground">Flow Weaver</span>
                    </div>
                    <p>&copy; {new Date().getFullYear()} Flow Weaver Inc. All rights reserved.</p>
                </div>
            </footer>
        </div>
    )
}
