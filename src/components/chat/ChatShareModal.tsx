import { useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { useTranslation } from '@/i18n/LanguageContext';

interface ChatShareModalProps {
  onClose: () => void;
  buildLink: () => Promise<string>;
  password?: string;
}

export function ChatShareModal({ onClose, buildLink, password }: ChatShareModalProps) {
  const { t } = useTranslation();
  const [link, setLink] = useState<string>('');

  useEffect(() => {
    buildLink()
      .then(setLink)
      .catch(() => setLink(''));
  }, [buildLink]);

  const copy = () => {
    if (!link) return;
    dialogService.alert(t.dashboard.alerts.linkCopied);

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.35)',
          zIndex: 140,
        }}
      />
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: '#252526',
          borderRadius: '10px',
          padding: '20px',
          boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
          zIndex: 150,
          width: 'min(90vw, 360px)',
          color: '#f0f0f0',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>{t.chat.shareLinkTitle ?? t.chat.copyLink}</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#bbb',
              cursor: 'pointer',
              width: 32,
              height: 32,
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src="https://cdn-icons-png.flaticon.com/128/4013/4013407.png"
              alt="close"
              style={{ width: 24, height: 24, filter: 'brightness(0) invert(1)' }}
            />
          </button>
        </div>

        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ background: 'white', padding: '8px', borderRadius: '8px' }}>
            {link ? (
              <QRCodeCanvas value={link} size={200} />
            ) : (
              <div style={{ width: 200, height: 200 }} />
            )}
          </div>
        </div>

        <div
          style={{
            marginTop: '12px',
            wordBreak: 'break-all',
            fontSize: '12px',
            backgroundColor: '#1e1e1e',
            padding: '8px',
            borderRadius: '6px',
            border: '1px solid #3e3e3e',
          }}
        >
          {link || t.chat.passwordPrompt}
        </div>

        {password && (
          <div
            style={{
              marginTop: '8px',
              fontSize: '12px',
              backgroundColor: '#1e1e1e',
              padding: '8px',
              borderRadius: '6px',
              border: '1px solid #3e3e3e',
            }}
          >
            <strong style={{ color: '#aaa', marginRight: '6px' }}>{t.auth.password}:</strong>
            <span style={{ fontFamily: 'monospace' }}>{password}</span>
          </div>
        )}

        <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            onClick={copy}
            disabled={!link}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: link ? '#007acc' : '#555',
              color: 'white',
              cursor: link ? 'pointer' : 'not-allowed',
            }}
          >
            {t.chat.copyLink}
          </button>
        </div>
      </div>
    </>
  );
}
