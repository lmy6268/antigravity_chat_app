import { QRCodeCanvas } from 'qrcode.react';
import { useTranslation, withParams } from '@/i18n/LanguageContext';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomUrl: string;
  roomName: string;
}

export function QRCodeModal({
  isOpen,
  onClose,
  roomUrl,
  roomName,
}: QRCodeModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#252526',
          padding: '30px',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          maxWidth: '90%',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: 0, color: '#f0f0f0' }}>
          {withParams(t.dashboard.qr.joinTitle, { roomName })}
        </h3>
        <div
          style={{
            padding: '20px',
            backgroundColor: 'white',
            borderRadius: '8px',
          }}
        >
          <QRCodeCanvas value={roomUrl} size={200} />
        </div>
        <p
          style={{
            color: '#aaa',
            fontSize: '14px',
            textAlign: 'center',
            wordBreak: 'break-all',
          }}
        >
          {roomUrl}
        </p>
        <button
          onClick={onClose}
          style={{
            padding: '10px 20px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: '#333',
            color: '#f0f0f0',
            cursor: 'pointer',
          }}
        >
          {t.common.close}
        </button>
      </div>
    </div>
  );
}
