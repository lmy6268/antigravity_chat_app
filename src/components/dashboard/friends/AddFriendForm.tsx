import { useState } from 'react';
import { useTranslation } from '@/i18n/LanguageContext';

interface AddFriendFormProps {
    onSubmit: (targetUsername: string) => Promise<void>;
}

export function AddFriendForm({ onSubmit }: AddFriendFormProps) {
    const { t } = useTranslation();
    const [friendUsername, setFriendUsername] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!friendUsername || isSubmitting) return;

        try {
            setIsSubmitting(true);
            await onSubmit(friendUsername);
            setFriendUsername('');
            alert(t.dashboard.friends.requestSent);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : t.common.error;
            alert(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ marginBottom: '30px' }}>
            <h3>{t.dashboard.friends.addTitle}</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px' }}>
                <input
                    type="text"
                    placeholder={t.dashboard.friends.enterUsername}
                    value={friendUsername}
                    onChange={(e) => setFriendUsername(e.target.value)}
                    disabled={isSubmitting}
                    style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '6px',
                        border: '1px solid #3e3e3e',
                        backgroundColor: '#1e1e1e',
                        color: 'white',
                    }}
                />
                <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                        padding: '10px 20px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: isSubmitting ? '#555' : '#007acc',
                        color: 'white',
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    }}
                >
                    {t.dashboard.friends.sendRequest}
                </button>
            </form>
        </div>
    );
}
