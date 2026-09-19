// TODO: hook managing the active session lifecycle (start/end, session_id).

export function useSession() {
  return { sessionId: null, startSession: () => {}, endSession: () => {} };
}
