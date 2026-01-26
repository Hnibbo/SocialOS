import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PerformanceMetrics {
  pageLoadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  memoryUsage: number;
  connectionType: string;
  deviceType: string;
}

interface UserSession {
  id: string;
  userId: string;
  startTime: number;
  duration: number;
  pageViews: number;
  events: string[];
  userAgent: string;
  referrer: string;
  deviceInfo: PerformanceMetrics;
}

export function usePerformanceMonitoring() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [sessionStartTime] = useState<number>(Date.now());

  const collectPerformanceMetrics = useCallback(() => {
    if (typeof window === 'undefined' || !window.performance) return;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint') as PerformancePaintTiming[];
    
    const webVitals = {
      pageLoadTime: navigation.loadEventEnd - navigation.fetchStart,
      firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
      largestContentfulPaint: 0,
      firstInputDelay: 0,
      cumulativeLayoutShift: 0,
      memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
      connectionType: (navigator as any).connection?.effectiveType || 'unknown',
      deviceType: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' : 'desktop'
    };

    setMetrics(webVitals);
    return webVitals;
  }, []);

  const observeWebVitals = useCallback(() => {
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      setMetrics(prev => ({
        ...prev!,
        largestContentfulPaint: entries[entries.length - 1].startTime
      }));
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      setMetrics(prev => ({
        ...prev!,
        firstInputDelay: entries[0].processingStart - entries[0].startTime
      }));
    }).observe({ entryTypes: ['first-input'] });

    let clsValue = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      setMetrics(prev => ({
        ...prev!,
        cumulativeLayoutShift: clsValue
      }));
    }).observe({ entryTypes: ['layout-shift'] });
  }, []);

  const trackUserEvent = useCallback((eventName: string, eventData?: any) => {
    const event = {
      name: eventName,
      data: eventData,
      timestamp: Date.now()
    };

    const events = JSON.parse(sessionStorage.getItem('sessionEvents') || '[]');
    events.push(event);
    sessionStorage.setItem('sessionEvents', JSON.stringify(events));

    if (['page_view', 'user_signup', 'purchase_completed', 'error_occurred'].includes(eventName)) {
      supabase
        .from('analytics_events')
        .insert({
          session_id: sessionId,
          event_name: eventName,
          event_data: eventData,
          timestamp: new Date().toISOString()
        })
        .then(({ error }) => {
          if (error) {
            console.error('Failed to log analytics event:', error);
          }
        });
    }
  }, [sessionId]);

  const startSession = useCallback((userId: string) => {
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);

    const deviceMetrics = collectPerformanceMetrics();
    
    const session: UserSession = {
      id: newSessionId,
      userId,
      startTime: sessionStartTime,
      duration: 0, // Updated on end
      pageViews: 1,
      events: [],
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      deviceInfo: deviceMetrics!
    };

    // Store session in database
    supabase
      .from('user_sessions')
      .insert(session)
      .then(({ error }) => {
        if (error) {
          console.error('Failed to start session:', error);
        }
      });

    // Start observing web vitals
    observeWebVitals();

    // Track initial page view
    trackUserEvent('page_view', {
      url: window.location.href,
      title: document.title,
      referrer: document.referrer
    });

    return newSessionId;
  }, [sessionStartTime, collectPerformanceMetrics, observeWebVitals, trackUserEvent]);

  const endSession = useCallback(() => {
    if (!sessionId) return;

    const duration = Date.now() - sessionStartTime;
    const events = JSON.parse(sessionStorage.getItem('sessionEvents') || '[]');

    // Update session with final data
    supabase
      .from('user_sessions')
      .update({
        duration,
        pageViews: events.filter(e => e.name === 'page_view').length,
        events
      })
      .eq('id', sessionId)
      .then(({ error }) => {
        if (error) {
          console.error('Failed to end session:', error);
        }
      });

    // Clear session storage
    sessionStorage.removeItem('sessionEvents');
    trackUserEvent('session_ended', { duration });
  }, [sessionId, sessionStartTime, trackUserEvent]);

  useEffect(() => {
    // Auto-cleanup on page unload
    const handleBeforeUnload = () => {
      endSession();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      endSession();
    };
  }, [endSession]);

  useEffect(() => {
    // Track page changes in SPA
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      setTimeout(() => trackUserEvent('page_view', {
        url: window.location.href,
        title: document.title
      }), 0);
    };

    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      setTimeout(() => trackUserEvent('page_view', {
        url: window.location.href,
        title: document.title
      }), 0);
    };

    return () => {
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, [trackUserEvent]);

  return {
    metrics,
    sessionId,
    startSession,
    endSession,
    trackUserEvent,
    collectPerformanceMetrics
  };
}