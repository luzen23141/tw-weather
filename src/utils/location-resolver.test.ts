import { resolveTaiwanLocation } from './location-resolver';

describe('location-resolver', () => {
  it('應可命中最近行政區並回填 city/township', () => {
    const location = resolveTaiwanLocation(25.033, 121.5654);

    expect(location.country).toBe('台灣');
    expect(location.city).toBe('台北市');
    expect(location.township).toBe('信義區');
    expect(location.district).toBe('信義區');
    expect(location.name).toBe('信義區');
  });

  it('台灣外座標應回退為座標字串', () => {
    const location = resolveTaiwanLocation(35.6895, 139.6917);

    expect(location.country).toBeUndefined();
    expect(location.city).toBeUndefined();
    expect(location.township).toBeUndefined();
    expect(location.name).toBe('35.6895, 139.6917');
  });
});
