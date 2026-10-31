import { useEffect } from "react";
import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import { supabase } from "@/shared/utils/supabase";
import type {
  RealtimePostgresChangesFilter,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";

type UseSupabaseSubscriptionArgs = {
  channelName: string;
  // ✅ en TU versión el genérico es el EVENTO, no el schema
  options: RealtimePostgresChangesFilter<"*">;
  queryKey: QueryKey;
};

export const useSupabaseSubscription = ({
  channelName,
  options,
  queryKey,
}: UseSupabaseSubscriptionArgs): void => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(channelName)
      // ✅ evento correcto (sin underscore)
      .on(
        "postgres_changes",
        options,
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const eventType = payload.eventType;
          if (eventType === "INSERT" || eventType === "UPDATE" || eventType === "DELETE") {
            queryClient.invalidateQueries({ queryKey });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelName, options, queryClient, queryKey]);
};