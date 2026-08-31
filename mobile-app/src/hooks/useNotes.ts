import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notesService } from "@/services/notes.service";
import { useAuthStore } from "@/store/authStore";
import { academicFromUser, academicKey } from "@/lib/personalization";
import type { NoteFilter, PrepNote } from "@/types";

export const notesQueryKeys = {
  list: (filter: NoteFilter, academic = "") => ["notes", "list", academic, filter] as const,
  detail: (id: string) => ["notes", "detail", id] as const,
};

export const useNotes = (filter: NoteFilter = {}) => {
  const user = useAuthStore((s) => s.user);
  const userId = user?.id;
  const academic = academicFromUser(user);
  return useQuery({
    queryKey: notesQueryKeys.list(filter, academicKey(academic)),
    queryFn: () => notesService.listNotes(userId as string, filter, academic),
    enabled: !!userId,
  });
};

export const useNote = (noteId: string) => {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: notesQueryKeys.detail(noteId),
    queryFn: () => notesService.getNote(noteId, userId as string),
    enabled: !!userId && !!noteId,
  });
};

/** Optimistically flips the bookmark and reconciles the cached lists/detail. */
export const useToggleNoteBookmark = () => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: ({ noteId, isBookmarked }: { noteId: string; isBookmarked: boolean }) =>
      notesService.setBookmark(userId as string, noteId, !isBookmarked),
    onSuccess: (_data, { noteId, isBookmarked }) => {
      const flip = (note: PrepNote | undefined) =>
        note && note.id === noteId ? { ...note, isBookmarked: !isBookmarked } : note;

      queryClient.setQueriesData<PrepNote[]>({ queryKey: ["notes", "list"] }, (list) =>
        list?.map((n) => flip(n) as PrepNote)
      );
      queryClient.setQueryData<PrepNote>(notesQueryKeys.detail(noteId), (n) => flip(n));
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
};
