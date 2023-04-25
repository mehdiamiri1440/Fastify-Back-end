import { h, Fragment } from 'nano-jsx';
import { Logo } from './Icons';

export const Header = ({
  title,
  info,
}: {
  title?: string;
  info?: JSX.IntrinsicElements;
}) => (
  <header class="mb-1">
    <div class="bg-gray d-flex align-center justify-between px-2">
      <span class="d-flex align-center">
        <Logo />
        <span class="divider lg"></span>
        <h2 class="header-title">{title}</h2>
      </span>
      {info}
    </div>
  </header>
);
