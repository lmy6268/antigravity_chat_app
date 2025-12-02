# Hybrid Encryption & Open Chat Guide

This document explains the **Hybrid Encryption** scheme used in our application, specifically focusing on the **Open Chat** mode where users can join via a password.

## 1. Concept: Hybrid Encryption

We use two layers of encryption:
1.  **Room Key (AES-GCM)**: A random symmetric key used to encrypt/decrypt actual chat messages. This key is unique per room.
2.  **Key Encryption Key (KEK)**: A key used to securely store/share the **Room Key**.
    -   **Open Chat Mode**: KEK is derived from the **Room Password**.
    -   **Private Mode (Future)**: KEK would be the user's **Public Key**.

## 2. Open Chat Flow (Password-based)

In this mode, the **Room Key** is stored on the server, but it is **encrypted** using the Room Password. The server never knows the password or the raw Room Key.

### A. Room Creation
1.  **Alice** (Creator) generates a random **Room Key** (AES-256).
2.  **Alice** generates a random **Salt** (16 bytes).
3.  **Alice** inputs the **Room Password**.
4.  **Alice** derives a **KEK** from (Password + Salt) using **PBKDF2**.
5.  **Alice** encrypts the **Room Key** using the **KEK**. -> `Encrypted Room Key`
6.  **Alice** sends `Salt` and `Encrypted Room Key` to the server.
    -   *Server stores these public values. It cannot decrypt the key without the password.*

### B. Joining a Room
1.  **Bob** (Joiner) inputs the **Room Password**.
2.  **Bob** fetches the `Salt` and `Encrypted Room Key` from the server.
3.  **Bob** derives the **KEK** from (Input Password + Salt) using **PBKDF2**.
4.  **Bob** decrypts the `Encrypted Room Key` using the **KEK**.
    -   *If the password is correct, decryption succeeds, and Bob gets the Room Key.*
    -   *If incorrect, decryption fails.*
5.  **Bob** can now decrypt chat messages using the **Room Key**.

## 3. Code Example

### Key Derivation (PBKDF2)
```typescript
const kek = await window.crypto.subtle.deriveKey(
  {
    name: "PBKDF2",
    salt: saltBuffer,
    iterations: 100000,
    hash: "SHA-256"
  },
  passwordKey,
  { name: "AES-GCM", length: 256 },
  true,
  ["encrypt", "decrypt", "wrapKey", "unwrapKey"]
);
```

### Encrypting Room Key
```typescript
const encryptedRoomKey = await window.crypto.subtle.encrypt(
  { name: "AES-GCM", iv: iv },
  kek,
  rawRoomKey
);
```

---

# 하이브리드 암호화 및 오픈 채팅 가이드

이 문서는 우리 애플리케이션에서 사용하는 **하이브리드 암호화** 방식, 특히 비밀번호를 통해 입장하는 **오픈 채팅(Open Chat)** 모드를 설명합니다.

## 1. 개념: 하이브리드 암호화

두 가지 계층의 암호화를 사용합니다:
1.  **방 키 (Room Key, AES-GCM)**: 실제 채팅 메시지를 암호화/복호화하는 데 사용되는 무작위 대칭키입니다. 방마다 고유합니다.
2.  **키 암호화 키 (KEK, Key Encryption Key)**: **방 키**를 안전하게 저장하거나 공유하기 위해 사용하는 키입니다.
    -   **오픈 채팅 모드**: 방 비밀번호에서 KEK를 생성합니다.
    -   **비공개 모드 (추후)**: 사용자의 공개키(Public Key)가 KEK가 됩니다.

## 2. 오픈 채팅 흐름 (비밀번호 기반)

이 모드에서는 **방 키**가 서버에 저장되지만, 방 비밀번호로 **암호화된 상태**로 저장됩니다. 서버는 비밀번호나 원본 방 키를 알 수 없습니다.

### A. 방 생성 (Creation)
1.  **앨리스**(방장)는 무작위 **방 키**(AES-256)를 생성합니다.
2.  **앨리스**는 무작위 **솔트(Salt)**(16바이트)를 생성합니다.
3.  **앨리스**는 **방 비밀번호**를 입력합니다.
4.  **앨리스**는 (비밀번호 + 솔트)를 이용해 **PBKDF2** 알고리즘으로 **KEK**를 생성합니다.
5.  **앨리스**는 **KEK**로 **방 키**를 암호화합니다. -> `암호화된 방 키`
6.  **앨리스**는 `솔트`와 `암호화된 방 키`를 서버에 전송합니다.
    -   *서버는 이 값들을 저장하지만, 비밀번호 없이는 키를 복호화할 수 없습니다.*

### B. 방 입장 (Joining)
1.  **밥**(참여자)은 **방 비밀번호**를 입력합니다.
2.  **밥**은 서버에서 `솔트`와 `암호화된 방 키`를 받아옵니다.
3.  **밥**은 (입력한 비밀번호 + 솔트)를 이용해 **PBKDF2** 알고리즘으로 **KEK**를 생성합니다.
4.  **밥**은 **KEK**로 `암호화된 방 키`를 복호화합니다.
    -   *비밀번호가 맞다면 복호화에 성공하여 방 키를 얻습니다.*
    -   *틀리다면 복호화에 실패합니다.*
5.  이제 **밥**은 **방 키**를 이용해 채팅 메시지를 복호화할 수 있습니다.

## 3. 보안 이점
- **서버가 키를 모름**: 서버 해킹 시에도 대화 내용이 유출되지 않습니다.
- **무작위 솔트 사용**: 방마다 솔트가 다르므로 레인보우 테이블 공격에 안전합니다.
- **비밀번호 변경 용이**: 방 키 자체를 바꿀 필요 없이, 방 키를 감싸는 비밀번호만 변경할 수 있습니다 (재암호화).



