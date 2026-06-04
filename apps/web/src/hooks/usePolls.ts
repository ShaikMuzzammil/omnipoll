import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { pollsApi } from "../lib/api";
import { toast } from "sonner";
import type { Poll } from "../types";

export function usePolls() {
  return useQuery({
    queryKey: ["polls"],
    queryFn: async () => {
      const data = await pollsApi.list();
      return data.polls;
    },
  });
}

export function usePoll(id: string) {
  return useQuery({
    queryKey: ["poll", id],
    queryFn: () => pollsApi.get(id),
    enabled: !!id,
  });
}

export function useCreatePoll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => pollsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["polls"] });
      toast.success("Poll created successfully!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeletePoll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pollsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["polls"] });
      toast.success("Poll deleted");
    },
  });
}

export function useSetStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => pollsApi.setStatus(id, status),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["poll", id] });
    },
  });
}
