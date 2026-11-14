import { css } from 'styled-components';

// At least the height of the screen, minus `offset` (e.g. a header above),
// for pages whose footer sits at the bottom of the screen.
//
// In mobile browsers 100vh is the height with their toolbars hidden (e.g.
// Safari on iOS), so a page that tall was taller than the screen with the
// toolbars shown: its footer was below the fold and the page scrolled. svh
// is the height with the toolbars shown; browsers without it use vh.
const fullHeight = (offset = '0px') => css`
  min-height: calc(100vh - ${offset});
  min-height: calc(100svh - ${offset});
`;

export default fullHeight;
