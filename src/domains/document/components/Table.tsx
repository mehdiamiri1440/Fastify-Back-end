import { h } from 'nano-jsx';

export const Table = ({
  children,
}: {
  children: JSX.IntrinsicElements | JSX.IntrinsicElements[];
}) => (
  <table
    style={{
      'border-radius': '0.25rem',
      width: '100%',
    }}
  >
    {children}
  </table>
);

const tdAndThCommon = {
  'text-align': 'left',
  padding: '0.6rem 0.8rem',
  'font-size': '12px',
};

export const Th = ({ children }: { children: any }) => (
  <th
    style={{
      'border-bottom': '1px solid #d7deef',
      'font-weight': 'bold',
      'background-color': '#eee',
      ...tdAndThCommon,
    }}
  >
    {children}
  </th>
);

export const Td = ({ children }: { children: any }) => (
  <td
    style={{
      'border-bottom': '1px solid #d7deef',
      ...tdAndThCommon,
    }}
  >
    {children}
  </td>
);

export const Tr = ({
  children,
}: {
  children: JSX.IntrinsicElements | JSX.IntrinsicElements[];
}) => <tr class="striped">{children}</tr>;
