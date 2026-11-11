import { router, type Href } from 'expo-router';

/**
 * Navigate to a route by plain path, e.g. go('/parade/abc') or go('/parade/[id]', { id }).
 * Typed routes only know about files that exist, so this casts once, here.
 */
export function go(path: string, params?: Record<string, string | number>) {
  router.push((params ? { pathname: path, params } : path) as Href);
}

export function goReplace(path: string, params?: Record<string, string | number>) {
  router.replace((params ? { pathname: path, params } : path) as Href);
}

/** Back if there is somewhere to go back to, otherwise replace with the fallback. */
export function goBackOr(fallback: string = '/') {
  if (router.canGoBack()) router.back();
  else router.replace(fallback as Href);
}
