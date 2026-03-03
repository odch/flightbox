import 'styled-components';

declare module 'styled-components' {
  export interface DefaultTheme {
    colors: {
      main: string;
      background: string;
      danger: string;
    };
    images: {
      logo: string;
    };
    logoSize?: number;
  }
}
