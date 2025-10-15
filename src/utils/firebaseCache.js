// Firebase 읽기 최적화를 위한 캐싱 유틸리티

class FirebaseCache {
  constructor() {
    this.cache = new Map();
    this.expirationTimes = new Map();
  }

  // 캐시에서 데이터 가져오기
  get(key, maxAgeMs = 300000) { // 기본 5분
    const now = Date.now();
    const expTime = this.expirationTimes.get(key);
    
    if (expTime && now < expTime && this.cache.has(key)) {
      return this.cache.get(key);
    }
    
    // 만료된 캐시 제거
    this.cache.delete(key);
    this.expirationTimes.delete(key);
    return null;
  }

  // 캐시에 데이터 저장
  set(key, data, maxAgeMs = 300000) { // 기본 5분
    this.cache.set(key, data);
    this.expirationTimes.set(key, Date.now() + maxAgeMs);
  }

  // 캐시 삭제
  delete(key) {
    this.cache.delete(key);
    this.expirationTimes.delete(key);
  }

  // 전체 캐시 초기화
  clear() {
    this.cache.clear();
    this.expirationTimes.clear();
  }

  // 만료된 캐시 정리
  cleanup() {
    const now = Date.now();
    for (const [key, expTime] of this.expirationTimes.entries()) {
      if (now >= expTime) {
        this.cache.delete(key);
        this.expirationTimes.delete(key);
      }
    }
  }
}

// 싱글톤 인스턴스
export const firebaseCache = new FirebaseCache();

// 5분마다 만료된 캐시 정리
setInterval(() => firebaseCache.cleanup(), 300000);