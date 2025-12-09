# Reusable Styles

이 디렉토리에는 프로젝트 전반에서 재사용 가능한 CSS 모듈이 포함되어 있습니다.

## 파일 구조

- **`variables.css`** - 글로벌 CSS 변수 (색상, 테마 등)
- **`buttons.module.css`** - 버튼 스타일
- **`layout.module.css`** - 페이지 레이아웃 스타일
- **`typography.module.css`** - 타이포그래피 스타일

## 사용 방법

### 1. CSS 변수 사용 (글로벌)

`variables.css`는 `app/globals.css`에 import되어 전역적으로 사용 가능합니다.

```css
/* 자동으로 사용 가능 */
.myComponent {
  color: var(--text-primary);
  background: var(--background);
}
```

### 2. CSS 모듈 사용

컴포넌트에서 필요한 모듈을 import하여 사용합니다.

```tsx
import styles from '@/styles/buttons.module.css';

export default function MyComponent() {
  return (
    <div className={styles.ctas}>
      <button className={styles.primary}>Primary Button</button>
      <button className={styles.secondary}>Secondary Button</button>
    </div>
  );
}
```

### 3. 여러 모듈 결합

```tsx
import buttonStyles from '@/styles/buttons.module.css';
import layoutStyles from '@/styles/layout.module.css';

export default function MyPage() {
  return (
    <div className={layoutStyles.page}>
      <main className={layoutStyles.main}>
        <div className={buttonStyles.ctas}>
          <button className={buttonStyles.primary}>Get Started</button>
        </div>
      </main>
    </div>
  );
}
```

## 이점

✅ **재사용성** - 동일한 스타일을 여러 컴포넌트에서 재사용  
✅ **유지보수** - 한 곳에서 스타일 변경 시 전체 적용  
✅ **모듈화** - 기능별로 스타일 분리하여 관리 용이  
✅ **타입 안정성** - CSS 모듈은 클래스명 자동완성 지원
