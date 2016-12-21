import { injectGlobal } from 'styled-components'

import fontEot from './fonts/MaterialIcons/MaterialIcons-Regular.eot';
import fontWoff2 from './fonts/MaterialIcons/MaterialIcons-Regular.woff2';
import fontWoff from './fonts/MaterialIcons/MaterialIcons-Regular.woff';
import fontTtf from './fonts/MaterialIcons/MaterialIcons-Regular.ttf';

injectGlobal`
  @font-face {
    font-family: 'Material Icons';
    font-style: normal;
    font-weight: 400;
    src: url('${fontEot}'); /* For IE6-8 */
    src: local('Material Icons'),
    local('MaterialIcons-Regular'),
    url('${fontWoff2}') format('woff2'),
    url('${fontWoff}') format('woff'),
    url('${fontTtf}') format('truetype');
  }
`;
