import {createHashHistory} from 'history';
import {applyShortLink} from './util/shortLink';

// The history reads the location once, when it is created
applyShortLink();

export const history = createHashHistory();
