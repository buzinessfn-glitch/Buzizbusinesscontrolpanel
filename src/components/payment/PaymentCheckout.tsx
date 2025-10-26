import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Check, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

declare global {
  interface Window {
    paypal?: any;
  }
}

interface PaymentCheckoutProps {
  plan: 'starter' | 'professional' | 'enterprise';
  onSuccess: (subscriptionData: any) => void;
  onCancel: () => void;
}

const PLAN_DETAILS = {
  starter: {
    name: 'Starter',
    price: 9,
    hasTrial: true,
    features: [
      'Up to 10 team members',
      'Basic time tracking',
      'Shift scheduling',
      'Task management',
      'Email support'
    ]
  },
  professional: {
    name: 'Professional',
    price: 29,
    hasTrial: false,
    features: [
      'Up to 50 team members',
      'Advanced time tracking & wages',
      'Inventory management',
      'Unlimited custom roles',
      'Activity logs & downloads',
      'Priority support'
    ]
  },
  enterprise: {
    name: 'Enterprise',
    price: 99,
    hasTrial: false,
    features: [
      'Unlimited team members',
      'Everything in Professional',
      'Advanced analytics',
      'API access',
      '24/7 phone support',
      'Dedicated account manager'
    ]
  }
};

// Get PayPal Client ID from environment variable or fallback to hardcoded for demo
const PAYPAL_CLIENT_ID = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PAYPAL_CLIENT_ID) 
  || 'AVPznqSR4j_y8O-P6Bgvf302qw7Wob5mRUCT0lB2NTf_hStwDWdS-Dfr4N5kUcC5zGNtXQFG-P6shYxn';

export function PaymentCheckout({ plan, onSuccess, onCancel }: PaymentCheckoutProps) {
  const [loading, setLoading] = useState(true);
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const planDetails = PLAN_DETAILS[plan];

  useEffect(() => {
    // Load PayPal SDK
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&vault=true&intent=subscription`;
    script.async = true;
    
    script.onload = () => {
      setPaypalLoaded(true);
      setLoading(false);
      renderPayPalButton();
    };

    script.onerror = () => {
      toast.error('Failed to load PayPal. Please try again.');
      setLoading(false);
    };

    document.body.appendChild(script);

    return () => {
      const existingScript = document.querySelector('script[src*="paypal.com/sdk/js"]');
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
      const paypalContainer = document.getElementById('paypal-button-container');
      if (paypalContainer) {
        paypalContainer.innerHTML = '';
      }
    };
  }, [plan]);

  const renderPayPalButton = () => {
    if (!window.paypal) return;

    const container = document.getElementById('paypal-button-container');
    if (!container) return;

    container.innerHTML = '';

    window.paypal.Buttons({
      createOrder: (data: any, actions: any) => {
        return actions.order.create({
          purchase_units: [{
            amount: {
              value: planDetails.price.toString(),
              currency_code: 'USD'
            },
            description: `Buziz ${planDetails.name} Plan - Monthly Subscription`
          }]
        });
      },
      onApprove: async (data: any, actions: any) => {
        try {
          const order = await actions.order.capture();
          
          // Calculate trial/billing dates
          const startDate = new Date();
          const trialEndsAt = planDetails.hasTrial 
            ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
            : null;
          const nextBillingDate = planDetails.hasTrial
            ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

          const subscriptionData = {
            plan: plan,
            orderId: order.id,
            status: planDetails.hasTrial ? 'trial' : 'active',
            startDate: startDate.toISOString(),
            trialEndsAt: trialEndsAt,
            nextBillingDate: nextBillingDate,
            amount: planDetails.price,
            officeCount: 0
          };

          localStorage.setItem('buziz:subscription', JSON.stringify(subscriptionData));
          
          toast.success(`Payment successful! ${planDetails.hasTrial ? 'Your 14-day trial starts now' : 'Welcome to Buziz ' + planDetails.name}`);
          onSuccess(subscriptionData);
        } catch (error) {
          console.error('Error capturing payment:', error);
          toast.error('Payment processing failed. Please try again.');
        }
      },
      onError: (err: any) => {
        console.error('PayPal error:', err);
        toast.error('Payment failed. Please try again.');
      },
      onCancel: () => {
        toast.info('Payment cancelled');
      },
      style: {
        layout: 'vertical',
        color: 'gold',
        shape: 'rect',
        label: 'pay'
      }
    }).render('#paypal-button-container');
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8 bg-white/5 border-2 border-yellow-400">
        <Button
          variant="ghost"
          onClick={onCancel}
          className="text-gray-400 hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to plans
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-3xl text-white mb-2">Complete Your Purchase</h1>
          <p className="text-gray-400">
            {planDetails.hasTrial 
              ? `14-day free trial, then $${planDetails.price}/month`
              : `$${planDetails.price}/month - starts immediately`
            }
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Plan Summary */}
          <div>
            <h2 className="text-xl text-white mb-4">Plan Summary</h2>
            <Card className="p-6 bg-white/5 border border-white/10 mb-4">
              <div className="flex items-baseline justify-between mb-4">
                <div>
                  <h3 className="text-2xl text-white">{planDetails.name}</h3>
                  <p className="text-gray-400 text-sm">Monthly subscription</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl text-yellow-400">${planDetails.price}</div>
                  <div className="text-gray-400 text-sm">/month</div>
                </div>
              </div>
              <div className="space-y-2">
                {planDetails.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </Card>
            {planDetails.hasTrial && (
              <Badge className="bg-yellow-400/20 text-yellow-400 border border-yellow-400/30">
                ✨ First 14 days free
              </Badge>
            )}
          </div>

          {/* Payment */}
          <div>
            <h2 className="text-xl text-white mb-4">Payment Method</h2>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-yellow-400 animate-spin mb-4" />
                <p className="text-gray-400">Loading payment options...</p>
              </div>
            ) : (
              <>
                <div id="paypal-button-container" className="mb-4"></div>
                <div className="text-center text-sm text-gray-400 mt-4">
                  <p>Secure payment powered by PayPal</p>
                  <p className="mt-2">Cancel anytime, no questions asked</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Terms */}
        <div className="border-t border-gray-800 pt-6 text-center text-sm text-gray-400">
          <p>
            By completing this purchase, you agree to our{' '}
            <a href="#" className="text-yellow-400 hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-yellow-400 hover:underline">Privacy Policy</a>.
          </p>
          {planDetails.hasTrial ? (
            <p className="mt-2">
              You will be charged ${planDetails.price} after your 14-day free trial ends.
            </p>
          ) : (
            <p className="mt-2">
              You will be charged ${planDetails.price} immediately and then monthly.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}