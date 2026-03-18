import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

const plans = [
    {
        name: "Basic",
        tier: "free",
        description: "Essential features for small teams",
        price: { monthly: 999, yearly: 9990 },
        features: ["Up to 3 workflows", "Basic expense tracking", "Standard support", "1GB Storage"],
    },
    {
        name: "Premium",
        tier: "pro",
        description: "Advanced features for growing companies",
        price: { monthly: 2999, yearly: 29990 },
        features: ["Unlimited workflows", "AI Workflow Generator", "Webhook API steps", "Advanced string rules", "Priority 24/7 support", "API access"],
        popular: true,
    },
];

export default function Pricing() {
    const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
    const { toast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const { subscriptionTier } = useUserRole();
    const [saving, setSaving] = useState(false);

    const isPublic = location.pathname !== "/admin/pricing";

    const handleSubscribe = async (plan: any, amount: number, isMock: boolean = false) => {
        if (isPublic) {
            navigate("/auth?mode=register");
            return;
        }

        if (isMock) {
            setSaving(true);
            try {
                const expiresAt = new Date();
                if (billingCycle === "monthly") {
                    expiresAt.setMonth(expiresAt.getMonth() + 1);
                } else {
                    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
                }

                const { error } = await supabase
                    .from('profiles')
                    .update({
                        subscription_tier: plan.tier,
                        is_premium: plan.tier === 'pro',
                        subscription_expires_at: expiresAt.toISOString(),
                        updated_at: new Date().toISOString()
                    } as any)
                    .eq('id', user?.id);

                if (error) {
                    toast({ title: "Error", description: error.message, variant: "destructive" });
                    return;
                }

                toast({
                    title: "Subscription Mocked",
                    description: `Successfully upgraded to ${plan.name} (Demo Mode).`,
                });
                navigate("/admin/dashboard");
            } finally {
                setSaving(false);
            }
            return;
        }

        // Dynamically load Razorpay script
        const res = await new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });

        if (!res) {
            toast({
                title: "Connection Error",
                description: "Razorpay SDK failed to load. Are you online?",
                variant: "destructive",
            });
            return;
        }

        const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_zS8B2vA8g1Fqj4",
            amount: amount * 100, // in paise
            currency: "INR",
            name: "Flow Weaver",
            description: `${plan.name} Subscription (${billingCycle})`,
            handler: async function (_response: any) {
                const expiresAt = new Date();
                if (billingCycle === "monthly") {
                    expiresAt.setMonth(expiresAt.getMonth() + 1);
                } else {
                    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
                }

                const { error } = await supabase
                    .from('profiles')
                    .update({
                        subscription_tier: plan.tier,
                        is_premium: plan.tier === 'pro',
                        subscription_expires_at: expiresAt.toISOString(),
                        updated_at: new Date().toISOString()
                    } as any)
                    .eq('id', user?.id);

                if (error) {
                    toast({
                        title: "Storage Error",
                        description: "Payment succeeded but failed to update status.",
                        variant: "destructive",
                    });
                    return;
                }

                toast({
                    title: "Payment Successful",
                    description: `Successfully upgraded to ${plan.name} plan.`,
                });
                navigate("/admin/dashboard");
            },
            prefill: {
                name: user?.full_name || "",
                email: user?.email || "",
            },
            theme: {
                color: "#2563ea",
            },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on("payment.failed", function (response: any) {
            toast({
                title: "Payment Failed",
                description: response.error.description,
                variant: "destructive",
            });
        });
        rzp.open();
    };

    return (
        <div className="py-20 px-4 md:px-8 max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">Simple, transparent pricing</h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Choose the perfect plan for your company's expense management needs.
                </p>

                <div className="flex items-center justify-center mt-8 gap-3">
                    <span className={`text-sm ${billingCycle === "monthly" ? "font-bold" : "text-muted-foreground"}`}>Monthly</span>
                    <button
                        onClick={() => setBillingCycle(cycle => cycle === "monthly" ? "yearly" : "monthly")}
                        className="w-14 h-7 bg-primary rounded-full relative flex items-center transition-colors px-1"
                    >
                        <div className={`w-5 h-5 bg-primary-foreground rounded-full transition-transform ${billingCycle === "yearly" ? "translate-x-7" : ""}`} />
                    </button>
                    <span className={`text-sm ${billingCycle === "yearly" ? "font-bold" : "text-muted-foreground"}`}>
                        Yearly <Badge variant="secondary" className="ml-1 text-xs bg-green-100 text-green-800 hover:bg-green-100">Save 16%</Badge>
                    </span>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {plans.map((plan) => {
                    const isCurrentPlan = subscriptionTier === plan.tier;
                    return (
                        <Card key={plan.name} className={`relative flex flex-col ${plan.popular ? "border-primary shadow-lg scale-105 z-10" : ""} ${isCurrentPlan ? "border-green-500 opacity-90" : ""}`}>
                            {plan.popular && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                    <Badge className="bg-primary text-primary-foreground px-3 py-1 text-sm font-medium">
                                        Most Popular
                                    </Badge>
                                </div>
                            )}
                            <CardHeader>
                                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                                <CardDescription>{plan.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <div className="my-6">
                                    <span className="text-4xl font-bold">₹{plan.price[billingCycle].toLocaleString("en-IN")}</span>
                                    <span className="text-muted-foreground">/{billingCycle === "monthly" ? "mo" : "yr"}</span>
                                </div>
                                <ul className="space-y-3">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-center gap-2">
                                            <Check className="h-4 w-4 text-primary" />
                                            <span className="text-sm">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <div className="space-y-2 w-full">
                                    <Button
                                        className="w-full"
                                        variant={plan.popular ? "default" : "outline"}
                                        onClick={() => handleSubscribe(plan, plan.price[billingCycle])}
                                        disabled={saving}
                                    >
                                        {isPublic ? "Sign Up" : (isCurrentPlan ? "Current Plan" : "Pay with Razorpay")}
                                    </Button>
                                    {!isPublic && !isCurrentPlan && (
                                        <Button
                                            className="w-full text-[10px] h-6 uppercase tracking-widest"
                                            variant="ghost"
                                            onClick={() => handleSubscribe(plan, plan.price[billingCycle], true)}
                                            disabled={saving}
                                        >
                                            Skip Payment (Demo)
                                        </Button>
                                    )}
                                </div>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
