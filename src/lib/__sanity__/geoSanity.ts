import { MOCK_ROUTE, MOCK_STOPS } from '@/data/mockTown';
import { destination, headingAtProgress, projectOnRoute, pointAtProgress, routeLengthM, turnList, WARN_ACROSS_MAIN, WARN_NO_LIGHTS } from '@/lib/geo';

/** Quick self-check for the geometry layer. Throws on the first failure; returns a summary. */
export function geoSanity(): string[] {
  const log: string[] = [];
  const assert = (ok: boolean, msg: string) => {
    if (!ok) throw new Error(`geoSanity: ${msg}`);
    log.push(`ok  ${msg}`);
  };

  const len = routeLengthM(MOCK_ROUTE);
  assert(len > 6000 && len < 7000, `route length ${len.toFixed(0)} m is 6–7 km`);

  const turns = turnList(MOCK_ROUTE, MOCK_STOPS);
  const got = turns.map((t) => (t.kind === 'left' || t.kind === 'right' ? `${t.kind} ${t.road}` : t.kind === 'stop' ? `stop ${t.stop?.seq}` : t.kind));
  const want = ['start', 'left Station Road', 'right High Street', 'stop 1', 'left Brent Way', 'stop 2', 'left Queens Road', 'right Station Road', 'finish'];
  assert(JSON.stringify(got) === JSON.stringify(want), `turn sequence ${got.join(' / ')}`);
  assert(turns[0].instruction === 'Leave car park, right onto Church Rd', `start line "${turns[0].instruction}"`);
  assert(turns[turns.length - 1].instruction === 'Finish · Station Road', `finish line "${turns[turns.length - 1].instruction}"`);
  const flagged = turns.filter((t) => t.warning);
  assert(flagged.length === 2, `${flagged.length} flagged turns`);
  assert(flagged[0].instruction === 'Left onto Station Road' && flagged[0].warning === WARN_NO_LIGHTS, 'no-lights flag on left onto Station Road');
  assert(flagged[1].instruction === 'Right onto Station Road' && flagged[1].warning === WARN_ACROSS_MAIN, 'across-main flag on right onto Station Road');

  // The midpoint is on High Street (runs east), so step 20 m at right angles to the route there.
  const mid = pointAtProgress(MOCK_ROUTE, len / 2);
  const proj = projectOnRoute(MOCK_ROUTE, destination(mid, headingAtProgress(MOCK_ROUTE, len / 2) + 90, 20));
  log.push(`    midpoint projection: progress ${proj.progressM.toFixed(1)} m, off ${proj.offRouteM.toFixed(2)} m`);
  assert(Math.abs(proj.offRouteM - 20) < 0.5, `20 m beside the midpoint → offRouteM ${proj.offRouteM.toFixed(2)}`);
  return log;
}
