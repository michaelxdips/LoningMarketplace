export function shouldFocusMain(previousPathname: string | null, pathname: string, hash: string) {
  return !hash && (previousPathname === null || previousPathname !== pathname);
}
