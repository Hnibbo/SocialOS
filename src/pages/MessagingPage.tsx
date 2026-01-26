import React from 'react';
import { MessagingHub } from '@/components/social/MessagingHub';
import { Helmet } from 'react-helmet-async';

const MessagingPage = () => {
    return (
        <>
            <Helmet>
                <title>Command Center | Hup Social OS</title>
                <meta name="description" content="Secure, encrypted messaging hub for the Hup Social OS." />
            </Helmet>
            <div className="flex-1 overflow-hidden h-full">
                <MessagingHub />
            </div>
        </>
    );
};

export default MessagingPage;
