import { useState } from 'react';
import { useTranslation } from '@/i18n/LanguageContext';

interface CreateRoomModalProps {
    onClose: () => void;
    onSubmit: (name: string, password: string) => void;
    isCreating: boolean;
}

export function CreateRoomModal({ onClose, onSubmit, isCreating }: CreateRoomModalProps) {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(name, password);
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <form onSubmit={handleSubmit} style={{
                backgroundColor: '#252526', padding: '30px', borderRadius: '12px',
                width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '15px'
            }}>
                <h2 style={{ margin: '0 0 10px 0' }}>{t.dashboard.createRoom.title}</h2>
                <input
                    type="text"
                    placeholder={t.dashboard.createRoom.namePlaceholder}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    style={{ padding: '10px', borderRadius: '6px', border: '1px solid #3e3e3e', backgroundColor: '#1e1e1e', color: 'white' }}
                />
                <div style={{ position: 'relative', width: '100%' }}>
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder={t.dashboard.createRoom.passwordPlaceholder}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{
                            padding: '10px',
                            paddingRight: '40px',
                            borderRadius: '6px',
                            border: '1px solid #3e3e3e',
                            backgroundColor: '#1e1e1e',
                            color: 'white',
                            width: '100%',
                            boxSizing: 'border-box'
                        }}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                            position: 'absolute',
                            right: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            color: '#aaa',
                            cursor: 'pointer',
                            fontSize: '18px',
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        {showPassword ? "🙈" : "👁️"}
                    </button>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button type="button" onClick={onClose} style={{
                        flex: 1, padding: '10px', borderRadius: '6px', border: 'none', backgroundColor: '#6c757d', color: 'white', cursor: 'pointer'
                    }}>
                        {t.common.cancel}
                    </button>
                    <button type="submit" disabled={isCreating} style={{
                        flex: 1, padding: '10px', borderRadius: '6px', border: 'none', backgroundColor: '#007acc', color: 'white', cursor: 'pointer',
                        opacity: isCreating ? 0.7 : 1
                    }}>
                        {isCreating ? t.common.loading : t.dashboard.createRoom.submit}
                    </button>
                </div>
            </form>
        </div>
    );
}
