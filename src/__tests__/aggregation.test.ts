import { median } from '@/aggregator/aggregation.utils';

describe('聚合工具測試', () => {
  describe('中位數計算', () => {
    it('應計算奇數陣列的中位數', () => {
      expect(median([1, 2, 3])).toBe(2);
      expect(median([5, 1, 3])).toBe(3);
      expect(median([10, 20, 30])).toBe(20);
    });

    it('應計算偶數陣列的中位數', () => {
      expect(median([1, 2, 3, 4])).toBe(2.5);
      expect(median([10, 20])).toBe(15);
      expect(median([1, 2, 3, 4, 5, 6])).toBe(3.5);
    });

    it('應處理單個元素', () => {
      expect(median([5])).toBe(5);
      expect(median([100])).toBe(100);
    });

    it('應處理空陣列', () => {
      expect(median([])).toBe(0);
    });

    it('應處理重複值', () => {
      expect(median([1, 1, 1])).toBe(1);
      expect(median([5, 5, 5, 5])).toBe(5);
      expect(median([1, 2, 2, 2, 3])).toBe(2);
    });

    it('應正確排序負數', () => {
      expect(median([-3, -1, -2])).toBe(-2);
      expect(median([-5, 0, 5])).toBe(0);
    });

    it('應正確排序浮點數', () => {
      expect(median([1.5, 2.5, 3.5])).toBe(2.5);
      expect(median([0.1, 0.2, 0.3, 0.4])).toBe(0.25);
    });

    it('應處理不排序的輸入', () => {
      expect(median([3, 1, 4, 1, 5, 9, 2, 6])).toBe(3.5);
      expect(median([9, 2, 6, 5, 3, 5])).toBe(5);
    });
  });
});
