'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { STORAGE_KEYS } from '@/lib/constants/storage';
import { routes } from '@/lib/routes';
import { useRoomList } from '@/hooks/dashboard/useRoomList';
import { useRoomCreate } from '@/hooks/dashboard/useRoomCreate';
import { useFriends } from '@/hooks/dashboard/useFriends';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardTabs } from '@/components/dashboard/DashboardTabs';
import { RoomList } from '@/components/dashboard/RoomList';
import { CreateRoomModal } from '@/components/dashboard/CreateRoomModal';
import { UserSettings } from '@/components/dashboard/UserSettings';
import { FriendsTab } from '@/components/dashboard/friends/FriendsTab';
import { QRCodeModal } from '@/components/dashboard/QRCodeModal';
import { UserEntity } from '@/types/entities';

export default function Dashboard() {
  const router = useRouter();

  // User State
  const [nickname, setNickname] = useState('');
  const [isProfileSet, setIsProfileSet] = useState(false);
  const [activeTab, setActiveTab] = useState<'rooms' | 'friends'>('rooms');

  // Hooks
  const { myRooms, joinRoom, deleteRoom, setMyRooms, loading } = useRoomList(nickname);
  const { createRoom, isCreating } = useRoomCreate(nickname, (newRoom) => {
    setMyRooms((prev) => [...prev, newRoom]);
    setShowCreateModal(false);
  });
  const { friends, sendFriendRequest, handleFriendAction, fetchFriends } = useFriends(nickname);

  // UI State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrRoomUrl, setQrRoomUrl] = useState('');
  const [qrRoomName, setQrRoomName] = useState('');

  // Load user on mount
  useEffect(() => {
    const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
    if (!storedUser) {
      router.push(routes.auth.login());
      return;
    }

    try {
      const user = JSON.parse(storedUser) as UserEntity;
      setNickname(user.username);
      setIsProfileSet(true);
      fetchFriends(user.username);
    } catch (e) {
      console.error('Failed to parse user info', e);
      localStorage.removeItem(STORAGE_KEYS.USER);
      router.push(routes.auth.login());
    }
  }, [router, fetchFriends]);

  const handleLogout = () => {
    localStorage.removeItem('chat_user');
    localStorage.removeItem('chat_nickname');
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
        <UserSettings />
        <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === 'rooms' ? (
          <RoomList
            rooms={myRooms}
            onJoinRoom={joinRoom}
            onDeleteRoom={deleteRoom}
            onCreateClick={() => setShowCreateModal(true)}
            loading={loading}
          />
        ) : (
          <FriendsTab
            friends={friends}
            onSendRequest={(targetUsername) => sendFriendRequest(nickname, targetUsername)}
            onAccept={(friendId) => handleFriendAction(friendId, 'accept')}
            onReject={(friendId) => handleFriendAction(friendId, 'reject')}
            onRemove={(friendId) => handleFriendAction(friendId, 'delete')}
            onCancel={(friendId) => handleFriendAction(friendId, 'delete')}
          />
        )}

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
