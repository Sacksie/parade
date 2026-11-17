import * as Clipboard from 'expo-clipboard';
import { Share } from 'react-native';

import { showToast } from '@/components/ui';
import { formatShortDate, parseISODate } from '@/lib/dates';
import type { Parade } from '@/types';

/**
 * Deep link into the app. A real https link needs a domain (and universal links);
 * until then the share text also carries the code so people can type it in.
 */
export const inviteLink = (code: string) => `parade://invite/${code}`;

export function inviteMessage(p: Parade): string {
  const date = formatShortDate(parseISODate(p.date));
  const where = p.meetingName ? ` at ${p.meetingName}` : '';
  return [
    `${p.name}${p.host ? ` with ${p.host}` : ''}: ${date}. Meet ${p.arriveAt}${where}, sets off ${p.setsOffAt}.`,
    `Join in the Parade app: ${inviteLink(p.code)}`,
    `Or open Parade and enter the code ${p.code}.`,
  ].join('\n');
}

export async function copyText(text: string, toast: string) {
  try {
    await Clipboard.setStringAsync(text);
    showToast(toast);
  } catch {
    showToast('Could not copy. Long-press to select instead.');
  }
}

/** System share sheet; browsers without navigator.share get the text copied instead. */
export async function shareText(message: string, fallbackToast = 'Copied. Paste it into WhatsApp.') {
  try {
    await Share.share({ message });
  } catch {
    await copyText(message, fallbackToast);
  }
}
