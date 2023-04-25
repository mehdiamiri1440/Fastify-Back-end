import { h, Fragment } from 'nano-jsx';
import { DocumentBuilder } from '../Builder';
import { App } from '../components/App';
import { Section } from '../components/Section';
import { Inbound } from '$src/domains/inbound/models/Inbound';
import { repo } from '$src/infra/utils/repo';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Signature, SignatureContainer } from '../components/Signature';
import { Table, Tr, Th, Td } from '../components/Table';
import { minio } from '$src/infra/s3';
import assert from 'assert';
import { Readable } from 'node:stream';
import { capitalCase } from 'case-anything';
import QRCode from 'qrcode';

const bucketName = 'inbound-signatures';

const formatter = new Intl.DateTimeFormat('es-ES', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

const format = (date: Date | null | undefined) =>
  date ? formatter.format(date) : '';

export class InboundDocument extends DocumentBuilder {
  inbound!: Inbound;
  creatorSign!: Buffer | null;
  driverSign!: Buffer | null;
  qrcode!: string;

  async loadProps(): Promise<void> {
    this.inbound = await repo(Inbound).findOneOrFail({
      where: {
        id: this.entity.typeId,
      },
      relations: {
        products: {
          product: {
            unit: true,
          },
          supplier: true,
        },
        driver: true,
        creator: true,
      },
    });

    this.creatorSign = this.inbound.creatorSignature
      ? await loadSignature(this.inbound.creatorSignature)
      : null;

    this.driverSign = this.inbound.driverSignature
      ? await loadSignature(this.inbound.driverSignature)
      : null;

    this.qrcode = await QRCode.toDataURL(
      'https://www.google.com/search?q=' + this.inbound.code,
    );
  }

  getTitle() {
    return 'hey';
  }

  getPdfName() {
    return 'a.pdf';
  }

  render(): JSX.IntrinsicElements {
    return (
      <App>
        <Section>
          <this.Header />
          <this.Content />
          <Footer>
            <SignatureContainer>
              <Signature label="Driver signature" signature={this.driverSign} />
              <Signature label="Clerk signature" signature={this.creatorSign} />
            </SignatureContainer>
          </Footer>
        </Section>
      </App>
    );
  }

  Header = () => {
    const Info = (
      <div class="d-flex">
        <div>
          <div>
            <span class="text-gray">ASN Status</span>
          </div>
          <div class="text-gray bold">
            ◯ {capitalCase(this.inbound.status.replaceAll('_', ' '))}
          </div>
        </div>
      </div>
    );

    return <Header title="Inbound" info={Info} />;
  };

  Content = () => {
    return (
      <div class="d-flex flex-column">
        <this.InboundInfo />
        <this.ProductsTable />
      </div>
    );
  };

  InboundInfo = () => {
    const { inbound } = this;
    return (
      <div class="d-flex flex-row">
        <div class="d-flex flex-wrap px-1 w-100">
          <div class="d-flex flex-column mb-1 w-50">
            <label class="text-gray">ASN Code</label>
            <p>{inbound.code}</p>
          </div>
          <div class="d-flex flex-column mb-1 w-50">
            <label class="text-gray">Clerk</label>
            <p>{inbound.creator.fullName}</p>
          </div>
          <div class="d-flex flex-column mb-1 w-50">
            <label class="text-gray">Date</label>
            <p>
              {format(inbound.createdAt)} {}
            </p>
          </div>
          <div class="d-flex flex-column mb-1 w-50">
            <label class="text-gray">Driver</label>
            <p>{inbound.driver?.fullName ?? '-'}</p>
          </div>
        </div>
        <div>
          <image src={this.qrcode}></image>
        </div>
      </div>
    );
  };

  ProductsTable = () => {
    const { inbound } = this;
    return (
      <Table>
        <colgroup>
          <col span="1" style="width: 10%" />
          <col span="1" style="width: 15%" />
          <col span="1" style="width: 60%" />
          <col span="1" style="width: 15%" />
        </colgroup>
        <thead>
          <Tr>
            <Th>Index</Th>
            <Th>Product</Th>
            <Th>Supplier</Th>
            <Th>ASN Quantity</Th>
          </Tr>
        </thead>
        <tbody>
          {inbound.products.map((e, index) => (
            <Tr>
              <Td>{index}</Td>
              <Td>{e.product.name}</Td>
              <Td>{e.supplier?.name ?? '-'}</Td>
              <Td>
                {e.actualQuantity} / {e.product.unit?.name}
              </Td>
            </Tr>
          ))}
          {inbound.products.map((e, index) => (
            <Tr>
              <Td>{index}</Td>
              <Td>{e.product.name}</Td>
              <Td>{e.supplier?.name ?? '-'}</Td>
              <Td>
                {e.actualQuantity} / {e.product.unit?.name}
              </Td>
            </Tr>
          ))}
          {inbound.products.map((e, index) => (
            <Tr>
              <Td>{index}</Td>
              <Td>{e.product.name}</Td>
              <Td>{e.supplier?.name ?? '-'}</Td>
              <Td>
                {e.actualQuantity} / {e.product.unit?.name}
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    );
  };
}

const loadSignature = async (fileId: string) => {
  assert(minio, 'document s3 client is not initialized');

  try {
    const readable = await minio.getObject(bucketName, fileId);
    const data = await readAll(readable);
    return Buffer.from(data);
  } catch (error: any) {
    if (error.code === 'NoSuchKey') {
      // the object doesn't exist in the S3 bucket
      return null;
    }
    throw error;
  }
};

async function readAll(stream: Readable) {
  const chunks: Buffer[] = [];

  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  // Concatenate all the chunks into a single Uint8Array
  const result = new Uint8Array(Buffer.concat(chunks));
  return result;
}
