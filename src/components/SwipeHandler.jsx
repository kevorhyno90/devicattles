import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const navOrder = ['/', '/livestock', '/crops', '/settings'];

export default function SwipeHandler() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let touchStartX = null;
    let touchEndX = null;

    function handleTouchStart(e) {
      touchStartX = e.touches[0].clientX;
    }
    function handleTouchMove(e) {
      touchEndX = e.touches[0].clientX;
    }
    function handleTouchEnd() {
      if (touchStartX === null || touchEndX === null) return;
      const deltaX = touchEndX - touchStartX;
      if (Math.abs(deltaX) > 60) {
        const currentIdx = navOrder.indexOf(location.pathname);
        if (deltaX < 0 && currentIdx < navOrder.length - 1) {
          navigate(navOrder[currentIdx + 1]);
        } else if (deltaX > 0 && currentIdx > 0) {
          navigate(navOrder[currentIdx - 1]);
        }
      }
      touchStartX = null;
      touchEndX = null;
    }
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [location, navigate]);
  return null;
}
