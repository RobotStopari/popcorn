import { useEffect } from 'react';
import { createParallaxController } from '../utils/parallax-scroll';

export function useParallax(refreshKey = '') {
  useEffect(() => {
    const controller = createParallaxController();
    controller.start();

    return () => controller.stop();
  }, [refreshKey]);
}
