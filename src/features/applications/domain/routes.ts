const APPLICATIONS_PATH = "/applications";

export const NEW_APPLICATION_PATH = `${APPLICATIONS_PATH}/new`;

/** Detail page of one application. */
export function applicationPath(id: string): string {
  return `${APPLICATIONS_PATH}/${encodeURIComponent(id)}`;
}
