import { h, Fragment } from 'nano-jsx';
import path from 'path';
import fs from 'fs';

const fonts = fs
  .readFileSync(path.join(__dirname, './css/fonts.css'))
  .toString();

const styles = fs
  .readFileSync(path.join(__dirname, './css/styles.css'))
  .toString();

export const App = ({ children }: { children: any[] }) => {
  return (
    <html lang="en">
      <head>
        <meta
          name="description"
          content="Server Side Rendered Nano JSX Application"
        />

        <style>{styles}</style>
        <style>{fonts}</style>
      </head>
      <body>{children}</body>
    </html>
  );
};
