import React from 'react';

interface ChatContainerProps {
    children: React.ReactNode;
}

export function ChatContainer({ children }: ChatContainerProps) {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            backgroundColor: '#1e1e1e',
            color: '#f0f0f0'
        }}>
            {children}
        </div>
    );
}
