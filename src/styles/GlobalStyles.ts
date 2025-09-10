import { createGlobalStyle } from 'styled-components';
import { theme } from './theme';

export const GlobalStyles = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Afacad:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: ${theme.fonts.body};
    background-color: ${theme.colors.background};
    color: ${theme.colors.text};
    font-size: ${theme.fontSizes.body};
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: ${theme.fonts.header};
    color: ${theme.colors.primary};
    font-weight: normal;
  }

  button {
    font-family: ${theme.fonts.body};
    cursor: pointer;
    border: none;
    outline: none;
    transition: all 0.3s ease;
  }

  input, select, textarea {
    font-family: ${theme.fonts.body};
    font-size: ${theme.fontSizes.button};
  }

  a {
    text-decoration: none;
    color: inherit;
    cursor: pointer;
  }
`;