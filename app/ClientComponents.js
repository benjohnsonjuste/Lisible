'use client';

import dynamic from 'next/dynamic';

export const ServiceWorkerRegistration = dynamic(() => import("@/components/ServiceWorkerRegistration"), { 
    ssr: false 
});

export const InstallPrompt = dynamic(() => import("@/components/InstallPrompt"), { 
    ssr: false 
});

export const LiveNotificationListener = dynamic(() => import("@/components/LiveNotificationListener"), { 
    ssr: false 
});

export const PushActivation = dynamic(() => import("@/components/PushActivation"), { 
    ssr: false 
});