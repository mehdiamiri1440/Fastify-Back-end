import { h } from 'nano-jsx';

const formatter = new Intl.DateTimeFormat('es-ES', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const format = (date: Date | null | undefined) =>
  date ? formatter.format(date) : '';

const styles = {
  margin: '0 auto',
  width: '120px',
  height: '120px',
  padding: '0.5rem',
};

export const Signature = ({
  label,
  signature,
  date,
}: {
  label: string;
  signature: Buffer | null;
  date?: Date | null;
}) => (
  <div class="signature d-flex flex-column justify-between border rounded p-1 w-100 h-100">
    <label>{label}</label>

    {!signature ? (
      <div style={styles}></div>
    ) : (
      <img
        style={styles}
        src={`data:image/png;base64,${signature!.toString('base64')}`}
      />
    )}

    <p class="down">{format(date)}</p>
  </div>
);

/**
 * This component receives a list of signatures as children and renders them in a single row.
 */
export const SignatureContainer = ({ children }: { children: any }) => {
  const signatures = Array.isArray(children) ? children : [children];

  const wrapped = signatures.map((s) => (
    <div class="w-50 px-1/2 d-flex">{s}</div>
  ));

  return <div class="d-flex justify-between">{wrapped}</div>;
};
