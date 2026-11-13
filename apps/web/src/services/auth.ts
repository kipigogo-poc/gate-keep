/**
 * Firebase Auth is wired in once the Firebase project exists. Until then no
 * ID token is available and protected calls fail with 401.
 */
export async function getIdToken(): Promise<string | null> {
  return null;
}
