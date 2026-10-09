import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Handles smooth scrolling to anchor hashes (e.g. /#features, /#plan-rescue, /#how-it-works)
 * and redirects non-root anchor routes (e.g. /dashboard#features) to the appropriate section.
 */
export const ScrollToHash: React.FC = () => {
  const { pathname, hash } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // If a hash was accessed from dashboard or another page that doesn't have the section,
    // redirect to the landing page anchor
    if (
      pathname !== '/' &&
      (hash === '#features' || hash === '#plan-rescue' || hash === '#how-it-works')
    ) {
      navigate(`/${hash}`, { replace: true });
      return;
    }

    if (hash) {
      const targetId = hash.replace('#', '');
      const timer = setTimeout(() => {
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);

      return () => clearTimeout(timer);
    } else if (pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [pathname, hash, navigate]);

  return null;
};
