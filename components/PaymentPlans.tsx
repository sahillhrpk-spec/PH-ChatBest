import React from 'react';
import { CheckCircleIcon, LogoIcon } from './IconComponents';

interface PlanFeatureProps {
  children: React.ReactNode;
}

const PlanFeature: React.FC<PlanFeatureProps> = ({ children }) => (
  <li className="flex items-center gap-3">
    <CheckCircleIcon className="w-5 h-5 text-indigo-500 flex-shrink-0" />
    <span className="text-gray-600 dark:text-gray-300">{children}</span>
  </li>
);

interface PlanCardProps {
    planName: string;
    price: string;
    description: string;
    features: string[];
    isPopular?: boolean;
    ctaText: string;
}

const PlanCard: React.FC<PlanCardProps> = ({ planName, price, description, features, isPopular, ctaText }) => (
    <div className={`relative flex flex-col p-8 rounded-2xl border ${isPopular ? 'border-indigo-500' : 'border-gray-200 dark:border-gray-700'} bg-white dark:bg-gray-800 shadow-lg`}>
        {isPopular && (
            <div className="absolute top-0 -translate-y-1/2 px-4 py-1 bg-indigo-500 text-white text-sm font-semibold rounded-full shadow-md">
                Most Popular
            </div>
        )}
        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{planName}</h3>
        <p className="mt-4 text-gray-500 dark:text-gray-400">{description}</p>
        <div className="mt-6">
            <span className="text-5xl font-extrabold text-gray-900 dark:text-white">{price}</span>
            <span className="text-lg font-medium text-gray-500 dark:text-gray-400">/month</span>
        </div>
        <ul className="mt-8 space-y-4 flex-grow">
            {features.map((feature, index) => (
                <PlanFeature key={index}>{feature}</PlanFeature>
            ))}
        </ul>
        <button className={`mt-10 w-full py-3 px-6 rounded-lg font-semibold transition-transform duration-200 hover:scale-105 ${isPopular ? 'bg-indigo-500 text-white hover:bg-indigo-600' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'}`}>
            {ctaText}
        </button>
    </div>
);


export const PaymentPlans: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 bg-gray-50 dark:bg-gray-900 overflow-y-auto">
      <div className="text-center mb-12">
        <LogoIcon className="w-16 h-16 text-indigo-500 mx-auto mb-4" />
        <h1 className="text-4xl font-extrabold mb-2 text-gray-800 dark:text-gray-100 tracking-tight">
          Find the perfect plan
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            Unlock more features and power with our premium plans, designed for individuals and teams of all sizes.
        </p>
      </div>
      
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <PlanCard 
            planName="Basic"
            price="$0"
            description="For individuals getting started with our AI assistant."
            features={[
                "20 messages per day",
                "Standard model access",
                "Conversation history",
                "Community support"
            ]}
            ctaText="Select Basic"
        />
        <PlanCard 
            planName="Pro"
            price="$0"
            description="For power users and professionals who need more."
            features={[
                "Unlimited messages",
                "Access to premium models",
                "Advanced image generation",
                "6K Upscaling & Enhancement",
                "Priority support"
            ]}
            isPopular
            ctaText="Activate Pro"
        />
        <PlanCard 
            planName="Enterprise"
            price="Custom"
            description="For organizations with advanced security and support needs."
            features={[
                "All Pro features",
                "Team management",
                "Custom model training",
                "Dedicated infrastructure",
                "24/7 Enterprise support"
            ]}
            ctaText="Contact Sales"
        />
      </div>
    </div>
  );
};