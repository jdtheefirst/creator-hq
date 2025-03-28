import { useEffect, useRef } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

interface UseAnalyticsProps {
  pagePath: string;
}

export function useAnalytics({ pagePath }: UseAnalyticsProps) {
  const supabase = createClientComponentClient();
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  const lastScrollPositionRef = useRef(0);

  useEffect(() => {
    // Track page view
    const trackPageView = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        await supabase.from("user_engagement").insert({
          creator_id: session.user.id,
          event_type: "page_view",
          page_path: pagePath,
        });
      }
    };

    // Track scroll events
    const handleScroll = () => {
      const currentScrollPosition = window.scrollY;
      const scrollDelta = Math.abs(
        currentScrollPosition - lastScrollPositionRef.current
      );

      if (scrollDelta > 100) {
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }

        scrollTimeoutRef.current = setTimeout(async () => {
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (session) {
            await supabase.from("user_engagement").insert({
              creator_id: session.user.id,
              event_type: "scroll",
              page_path: pagePath,
              duration_seconds: 0,
            });
          }
        }, 1000);
      }

      lastScrollPositionRef.current = currentScrollPosition;
    };

    // Track click events
    const handleClick = async (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const elementId = target.id || target.className || "unknown";

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        await supabase.from("user_engagement").insert({
          creator_id: session.user.id,
          event_type: "click",
          page_path: pagePath,
          element_id: elementId,
          duration_seconds: 0,
        });
      }
    };

    // Track hover events
    const handleHover = async (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const elementId = target.id || target.className || "unknown";

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        await supabase.from("user_engagement").insert({
          creator_id: session.user.id,
          event_type: "hover",
          page_path: pagePath,
          element_id: elementId,
          duration_seconds: 0,
        });
      }
    };

    // Track time spent on page
    const startTime = Date.now();
    const trackTimeSpent = () => {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      if (timeSpent > 0) {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session) {
            supabase.from("user_engagement").insert({
              creator_id: session.user.id,
              event_type: "time_spent",
              page_path: pagePath,
              duration_seconds: timeSpent,
            });
          }
        });
      }
    };

    // Initialize tracking
    trackPageView();
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("click", handleClick);
    window.addEventListener("mouseover", handleHover);

    // Cleanup
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("click", handleClick);
      window.removeEventListener("mouseover", handleHover);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      trackTimeSpent();
    };
  }, [pagePath, supabase]);
}
