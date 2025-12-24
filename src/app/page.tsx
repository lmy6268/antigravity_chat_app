'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadUserProfile, clearUserSession } from '@/lib/key-storage';
import { STORAGE_KEYS } from '@/lib/constants/storage';
import { routes } from '@/lib/routes';
import { useRoomList } from '@/hooks/dashboard/useRoomList';
import { useRoomCreate } from '@/hooks/dashboard/useRoomCreate';
import { useFriends } from '@/hooks/dashboard/useFriends';
import { DASHBOARD_TABS, DashboardTab } from '@/lib/constants/dashboard';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardTabs } from '@/components/dashboard/DashboardTabs';
import { RoomList } from '@/components/dashboard/RoomList';
import { CreateRoomModal } from '@/components/dashboard/CreateRoomModal';
import { UserSettings } from '@/components/dashboard/UserSettings';
<<<<<<< HEAD
import { FriendsTab } from '@/components/dashboard/friends/FriendsTab';
import { QRCodeModal } from '@/components/dashboard/QRCodeModal';
import { buildFullUrl } from '@/lib/utils/url';
import type { UserUIModel, RoomUIModel } from '@/types/uimodel';
import type { UserEntity } from '@/types/entities';
=======

interface Friend {
  id: string;
  username: string;
  status: 'pending' | 'accepted';
  isSender: boolean;
}
>>>>>>> origin/develop

export default function Dashboard() {
  const router = useRouter();

  // User State
  const [nickname, setNickname] = useState('');
  const [userId, setUserId] = useState('');
  const [isProfileSet, setIsProfileSet] = useState(false);
  const [activeTab, setActiveTab] = useState<DashboardTab>(
    DASHBOARD_TABS.ROOMS,
  );

  // Hooks
  const { myRooms, joinRoom, deleteRoom, setMyRooms, loading } =
    useRoomList(nickname);
  const { createRoom, isCreating } = useRoomCreate(
    nickname,
    (newRoom: RoomUIModel) => {
      setMyRooms((prev: RoomUIModel[]) => [...prev, newRoom]);
      setShowCreateModal(false);
    },
  );
  const { friends, sendFriendRequest, handleFriendAction, fetchFriends } =
    useFriends(nickname);

  // UI State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrRoomUrl, setQrRoomUrl] = useState('');
  const [qrRoomName, setQrRoomName] = useState('');

  // Load user on mount
  useEffect(() => {
    const initDashboard = async () => {
      const user = await loadUserProfile();
      if (!user) {
        router.push(routes.auth.login());
        return;
      }

      setNickname(user.username);
      setUserId(user.id);
      setIsProfileSet(true);
      fetchFriends(user.username);
    };
    initDashboard();
  }, [router, fetchFriends]);

  const handleLogout = async () => {
    await clearUserSession();
    setIsProfileSet(false);
    setNickname('');
    router.push(routes.auth.login());
  };

  if (!isProfileSet) return null;

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#1e1e1e',
        color: '#f0f0f0',
        padding: '15px',
      }}
    >
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <DashboardHeader nickname={nickname} onLogout={handleLogout} />
        <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />

<<<<<<< HEAD
        {activeTab === DASHBOARD_TABS.ROOMS && (
=======
        <UserSettings />

        <div
          style={{
            display: 'flex',
            gap: '20px',
            marginBottom: '20px',
            borderBottom: '1px solid #3e3e3e',
          }}
        >
          <button
            onClick={() => setActiveTab('rooms')}
            style={{
              padding: '10px 20px',
              background: 'none',
              border: 'none',
              color: activeTab === 'rooms' ? '#007acc' : '#aaa',
              borderBottom: activeTab === 'rooms' ? '2px solid #007acc' : 'none',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            {t.dashboard.tabs.rooms}
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            style={{
              padding: '10px 20px',
              background: 'none',
              border: 'none',
              color: activeTab === 'friends' ? '#007acc' : '#aaa',
              borderBottom: activeTab === 'friends' ? '2px solid #007acc' : 'none',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            {t.dashboard.tabs.friends}
          </button>
        </div>

        {activeTab === 'rooms' ? (
>>>>>>> origin/develop
          <RoomList
            rooms={myRooms}
            onJoinRoom={joinRoom}
            onDeleteRoom={deleteRoom}
            onCreateClick={() => setShowCreateModal(true)}
            loading={loading}
          />
        )}

        {activeTab === DASHBOARD_TABS.FRIENDS && (
          <FriendsTab
            friends={friends}
            onSendRequest={(targetUsername: string) =>
              sendFriendRequest(nickname, targetUsername)
            }
            onAccept={(friendId: string) =>
              handleFriendAction(friendId, 'accept')
            }
            onReject={(friendId: string) =>
              handleFriendAction(friendId, 'reject')
            }
            onRemove={(friendId: string) =>
              handleFriendAction(friendId, 'delete')
            }
            onCancel={(friendId: string) =>
              handleFriendAction(friendId, 'delete')
            }
          />
        )}

        {activeTab === DASHBOARD_TABS.SETTINGS && <UserSettings />}

        {showCreateModal && (
          <CreateRoomModal
            onClose={() => setShowCreateModal(false)}
            onSubmit={createRoom}
            isCreating={isCreating}
          />
        )}

        <QRCodeModal
          isOpen={showQRModal}
          onClose={() => setShowQRModal(false)}
          roomUrl={qrRoomUrl}
          roomName={qrRoomName}
        />
      </div>
    </div>
  );
}
