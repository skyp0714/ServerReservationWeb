# Firebase Composite Index 최적화

## 필수 인덱스 설정 (Firebase Console에서 설정)

### 1. Reservations Collection
```
Collection: reservations
Fields:
- start (Ascending)
- end (Ascending)
- server (Ascending)

Collection: reservations  
Fields:
- end (Ascending) 
- username (Ascending)

Collection: reservations
Fields:
- start (Ascending)
- username (Ascending)

Collection: reservations
Fields:
- start (Ascending)
- start (Ascending)

Collection: reservations
Fields:
- server (Ascending)
- start (Ascending)
```

### 2. Announcements Collection
```
Collection: announcements
Fields:
- createdAt (Descending)
- pinned (Ascending)
```

### 3. Devices Collection
```
Collection: devices
Fields:
- status (Ascending)
- owner (Ascending)
- type (Ascending)
```

## 쿼리 최적화 팁
1. 복합 쿼리는 인덱스 필요
2. orderBy는 항상 마지막 필드로
3. where 조건은 등호(==)부터, 범위(<, >) 마지막
4. array-contains는 하나만 사용