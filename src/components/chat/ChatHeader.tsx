interface ChatHeaderProps {
  roomName: string;
  onBack: () => void;
  onSettings: () => void;
  onShare: () => void;
}

export function ChatHeader({
  roomName,
  onBack,
  onSettings,
  onShare,
}: ChatHeaderProps) {
  return (
    <div
      style={{
        padding: '15px',
        backgroundColor: '#252526',
        borderBottom: '1px solid #3e3e3e',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      <button
        onClick={onBack}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          width: 32,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img
          src="/icons/back.png"
          alt="back"
          style={{
            width: 24,
            height: 24,
            filter: 'brightness(0) invert(1)', // 테마에 맞춰 흰색
          }}
        />
      </button>

      <h2
        style={{
          margin: 0,
          fontSize: 'clamp(1rem, 4vw, 1.25rem)',
          wordBreak: 'break-word',
          textAlign: 'center',
          flex: 1,
        }}
      >
        {roomName}
      </h2>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <button
          onClick={onShare}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
          }}
          aria-label="Share room link"
        >
          <img
            src="/icons/share.png"
            alt="share icon"
            style={{
              width: 24,
              height: 24,
              filter: 'brightness(0) invert(1)', // 테마에 맞춰 흰색
            }}
          />
        </button>
        <button
          onClick={onSettings}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
          }}
        >
          <img
            src="/icons/menu.png"
            alt="menu"
            style={{
              width: 24,
              height: 24,
              filter: 'brightness(0) invert(1)', // 테마에 맞춰 흰색
            }}
          />
        </button>
      </div>
    </div>
  );
}
