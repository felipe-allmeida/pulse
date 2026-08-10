import type { ClientSignals } from '@/lib/client-signals';
import type { VisitorContext } from '@/types/pulse';

/**
 * Builds the OpenRTB 2.6 bid request an ad exchange would assemble for this
 * visitor, from the readings this page already took.
 *
 * The point of showing it is that none of it is exotic. Every field below is
 * filled from something the browser volunteered without a prompt — this is the
 * message that gets broadcast to dozens of bidders, in about a tenth of a
 * second, on any ad-supported page.
 *
 * Two fields are deliberately not real, and the page says which and why:
 *
 * - `device.ip` is withheld. A real exchange receives it; this page has it
 *   server-side only for the city lookup and throws it away, so there is
 *   nothing to print — and printing someone's IP back at them is exactly the
 *   move this page argues against.
 * - `user.data.segment` is a placeholder, passed in by the caller so it can be
 *   localised. That slot is where a data broker attaches inferred *intent* —
 *   "in-market for a car", "new parent", "cardholder" — and it is the part that
 *   actually sells. It stays visibly a placeholder rather than being filled
 *   with plausible-looking segments: inventing someone's inferred interests and
 *   presenting them as read is the exact dishonesty this page objects to. It
 *   cannot be filled honestly, because filling it means paying a broker, which
 *   is the asymmetry — the bidders can see it, the person it describes cannot.
 */
export type BidRequest = Record<string, unknown>;

/** OpenRTB `device.devicetype`: 1 = mobile/tablet, 2 = personal computer. */
function deviceType(signals: ClientSignals): number {
  if (signals.os === 'Android' || signals.os === 'iOS') return 1;
  return 2;
}

/** OpenRTB `device.make` — the vendor an exchange would infer from the platform. */
function deviceMake(signals: ClientSignals): string {
  switch (signals.os) {
    case 'iOS':
    case 'macOS':
      return 'Apple';
    case 'Android':
      return 'Android';
    case 'Windows':
      return 'Microsoft';
    default:
      return 'unknown';
  }
}

export function buildBidRequest(
  signals: ClientSignals,
  visitor: VisitorContext | undefined,
  /** Localised placeholder for `user.data.segment` — see the note above. */
  segmentPlaceholder: string,
): BidRequest {
  return {
    id: 'auction-xxxxxxxx',
    at: 2,
    tmax: 120,
    imp: [
      {
        id: '1',
        banner: { w: 300, h: 250 },
        bidfloor: 0.5,
        bidfloorcur: 'USD',
        secure: 1,
      },
    ],
    site: {
      domain: window.location.hostname,
      page: window.location.href,
      publisher: { domain: window.location.hostname },
    },
    device: {
      ua: signals.userAgent,
      // See the note above: an exchange gets the real value here.
      ip: '<withheld — this page never keeps yours>',
      geo: visitor?.geo
        ? { lat: visitor.geo.lat, lon: visitor.geo.lon, country: visitor.geo.country, city: visitor.geo.city, type: 2 }
        : { type: 2 },
      devicetype: deviceType(signals),
      make: deviceMake(signals),
      os: signals.os,
      h: signals.screenHeight ?? 0,
      w: signals.screenWidth ?? 0,
      pxratio: signals.pixelRatio ?? 1,
      js: 1,
      language: signals.language.split('-')[0],
      dnt: signals.doNotTrack ? 1 : 0,
      lmt: 0,
    },
    user: {
      id: '<exchange-assigned ID from an ID-sync cookie>',
      buyeruid: '<buyer-specific ID>',
      data: [
        {
          id: '<data-provider>',
          name: 'a-data-broker.example',
          segment: [{ id: 'PLACEHOLDER', name: segmentPlaceholder }],
        },
      ],
    },
    regs: { ext: { gdpr: 0 } },
  };
}
