// Firebase 읽기/삭제 최적화 유틸리티

import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  writeBatch,
  doc,
  startAfter
} from 'firebase/firestore';
import { firestore } from '@/firebase';
import { firebaseCache } from './firebaseCache';

export class FirebaseOptimizer {
  
  // 페이지네이션을 지원하는 효율적인 읽기
  static async getDocuments(collectionName, options = {}) {
    const {
      where: whereConditions = [],
      orderBy: orderByField,
      orderByDirection = 'asc',
      limit: limitCount = 50,
      startAfter: startAfterDoc = null,
      useCache = true,
      cacheKey = null,
      cacheMaxAge = 300000 // 5분
    } = options;

    // 캐시 확인
    const finalCacheKey = cacheKey || `${collectionName}_${JSON.stringify(options)}`;
    if (useCache) {
      const cached = firebaseCache.get(finalCacheKey, cacheMaxAge);
      if (cached) {
        console.log(`Cache hit for ${finalCacheKey}`);
        return cached;
      }
    }

    try {
      let q = collection(firestore, collectionName);

      // Where 조건 적용
      whereConditions.forEach(condition => {
        q = query(q, where(condition.field, condition.operator, condition.value));
      });

      // OrderBy 적용
      if (orderByField) {
        q = query(q, orderBy(orderByField, orderByDirection));
      }

      // Limit 적용
      if (limitCount) {
        q = query(q, limit(limitCount));
      }

      // StartAfter 적용 (페이지네이션)
      if (startAfterDoc) {
        q = query(q, startAfter(startAfterDoc));
      }

      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        _docRef: doc // 페이지네이션을 위해 참조 보존
      }));

      // 캐시에 저장
      if (useCache) {
        firebaseCache.set(finalCacheKey, docs, cacheMaxAge);
      }

      return docs;
    } catch (error) {
      console.error(`Error fetching ${collectionName}:`, error);
      throw error;
    }
  }

  // 효율적인 배치 삭제
  static async batchDelete(collectionName, whereConditions = [], options = {}) {
    const {
      batchSize = 500,
      maxDeleteCount = 5000
    } = options;

    let totalDeleted = 0;
    let hasMore = true;

    while (hasMore && totalDeleted < maxDeleteCount) {
      try {
        // 삭제할 문서 쿼리
        let q = collection(firestore, collectionName);
        
        whereConditions.forEach(condition => {
          q = query(q, where(condition.field, condition.operator, condition.value));
        });
        
        q = query(q, limit(batchSize));

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          hasMore = false;
          break;
        }

        // 배치 삭제
        const batch = writeBatch(firestore);
        
        snapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });

        await batch.commit();
        totalDeleted += snapshot.size;

        console.log(`Batch deleted ${snapshot.size} documents from ${collectionName}`);

        // 배치 크기보다 적으면 더 이상 없음
        if (snapshot.size < batchSize) {
          hasMore = false;
        }

        // 연속 요청 사이에 짧은 대기
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

      } catch (error) {
        console.error(`Error in batch delete for ${collectionName}:`, error);
        throw error;
      }
    }

    return totalDeleted;
  }

  // 조건부 삭제 (예: 3개월 이상된 데이터)
  static async deleteOldDocuments(collectionName, dateField, monthsOld = 3) {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - monthsOld);

    return this.batchDelete(collectionName, [
      {
        field: dateField,
        operator: '<',
        value: cutoffDate.toISOString()
      }
    ]);
  }

  // 메모리 효율적인 문서 스트림 처리
  static async processDocumentsInBatches(
    collectionName, 
    whereConditions = [], 
    processFn, 
    batchSize = 100
  ) {
    let lastDoc = null;
    let hasMore = true;
    let totalProcessed = 0;

    while (hasMore) {
      const docs = await this.getDocuments(collectionName, {
        where: whereConditions,
        limit: batchSize,
        startAfter: lastDoc,
        useCache: false // 스트림 처리에서는 캐시 사용 안함
      });

      if (docs.length === 0) {
        hasMore = false;
        break;
      }

      // 배치 처리
      await processFn(docs);
      totalProcessed += docs.length;

      // 다음 페이지를 위한 마지막 문서 저장
      lastDoc = docs[docs.length - 1]._docRef;

      // 배치 크기보다 적으면 마지막 배치
      if (docs.length < batchSize) {
        hasMore = false;
      }
    }

    return totalProcessed;
  }

  // 캐시 무효화
  static invalidateCache(pattern) {
    // 패턴에 맞는 캐시 키 삭제
    for (const key of firebaseCache.cache.keys()) {
      if (key.includes(pattern)) {
        firebaseCache.delete(key);
      }
    }
  }
}

export default FirebaseOptimizer;