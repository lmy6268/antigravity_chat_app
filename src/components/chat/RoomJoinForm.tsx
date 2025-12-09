import { useTranslation, withParams } from '@/i18n/LanguageContext';

interface RoomJoinFormProps {
  roomName: string;
  password: string;
  setPassword: (value: string) => void;
  showPassword: boolean;
  togglePasswordVisibility: () => void;
  onJoin: (e: React.FormEvent) => void;
  onBack: () => void;
  error?: string;
}

export function RoomJoinForm({
  roomName,
  password,
  setPassword,
  showPassword,
  togglePasswordVisibility,
  onJoin,
  onBack,
  error,
}: RoomJoinFormProps) {
  const { t } = useTranslation();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#1e1e1e',
        color: '#f0f0f0',
        padding: '15px',
      }}
    >
      <div
        style={{
          backgroundColor: '#252526',
          padding: 'clamp(20px, 5vw, 40px)',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          width: '100%',
          maxWidth: '400px',
        }}
      >
        <h2
          style={{
            margin: '0 0 10px 0',
            textAlign: 'center',
            fontSize: 'clamp(1.25rem, 4vw, 1.5rem)',
          }}
        >
          {withParams(t.chat.joinTitle, { roomName })}
        </h2>
        <p
          style={{
            textAlign: 'center',
            color: '#aaa',
            fontSize: 'clamp(0.875rem, 3vw, 1rem)',
          }}
        >
          {t.chat.passwordPrompt}
        </p>

        {error && (
          <div
            style={{
              backgroundColor: 'rgba(217, 83, 79, 0.1)',
              color: '#d9534f',
              padding: '10px',
              borderRadius: '6px',
              fontSize: '14px',
              textAlign: 'center',
            }}
          >
            {error}
          </div>
        )}

        <div style={{ position: 'relative', width: '100%' }}>
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t.dashboard.createRoom.passwordPlaceholder}
            style={{
              padding: '12px',
              paddingRight: '40px',
              borderRadius: '6px',
              border: '1px solid #3e3e3e',
              backgroundColor: '#1e1e1e',
              color: 'white',
              fontSize: 'clamp(0.875rem, 3vw, 1rem)',
              width: '100%',
              boxSizing: 'border-box',
            }}
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
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
              justifyContent: 'center',
            }}
          >
            {showPassword ? '🙈' : '👁️'}
          </button>
        </div>

        <button
          onClick={onJoin}
          style={{
            padding: '14px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: '#007acc',
            color: 'white',
            fontSize: 'clamp(0.875rem, 3vw, 1rem)',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          {t.chat.joinButton}
        </button>

        <button
          onClick={onBack}
          style={{
            padding: '10px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: 'transparent',
            color: '#aaa',
            cursor: 'pointer',
            fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)',
          }}
        >
          {t.chat.backButton}
        </button>
      </div>
    </div>
  );
}
