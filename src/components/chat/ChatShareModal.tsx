import { useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { useTranslation } from '@/i18n/LanguageContext';
import { dialogService } from '@/lib/dialog';
import Image from 'next/image';

interface ChatShareModalProps {
  onClose: () => void;
  buildLink: () => Promise<string>;
  password?: string;
}

export function ChatShareModal({
  onClose,
  buildLink,
  password,
}: ChatShareModalProps) {
  const { t } = useTranslation();
  const [link, setLink] = useState<string>('');

  useEffect(() => {
    buildLink()
      .then(setLink)
      .catch(() => setLink(''));
  }, [buildLink]);

  const copy = () => {
    if (!link) return;
    navigator.clipboard.writeText(link);
    dialogService.alert(t.dashboard.alerts.linkCopied);
  };

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
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h3 style={{ margin: 0 }}>
            {t.chat.shareLinkTitle ?? t.chat.copyLink}
          </h3>
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
            <Image
              src="/icons/close.png"
              alt="close"
              width={24}
              height={24}
              style={{
                filter: 'brightness(0) invert(1)',
              }}
            />
          </button>
        </div>

        <div
          style={{
            marginTop: '16px',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <div
            style={{ background: 'white', padding: '8px', borderRadius: '8px' }}
          >
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

        {/* Password Display / Explanation Section */}
        <div
          style={{
            marginTop: '12px',
            fontSize: '12px',
            backgroundColor: '#252526',
            padding: '10px',
            borderRadius: '6px',
            border: '1px solid #3e3e3e',
            color: '#ccc',
            lineHeight: '1.4',
          }}
        >
          {password ? (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ color: '#aaa' }}>{t.auth.password}:</span>
              <span
                style={{
                  fontFamily: 'monospace',
                  color: '#fff',
                  fontWeight: 'bold',
                }}
              >
                {password}
              </span>
            </div>
          ) : (
            <div>
              <strong style={{ color: '#4caf50' }}>
                ✅ No Password Needed for Invitees!
              </strong>
              <div
                style={{ marginTop: '4px', fontSize: '11px', color: '#999' }}
              >
                Use <strong>Settings {'>'} Invite</strong> to give specific
                users access. They can then click this link to join instantly.
              </div>
              <div
                style={{
                  marginTop: '8px',
                  borderTop: '1px solid #444',
                  paddingTop: '4px',
                  fontSize: '10px',
                  color: '#666',
                }}
              >
                * To share a general password, please re-login manually to
                reveal it.
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            marginTop: '12px',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
          }}
        >
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
