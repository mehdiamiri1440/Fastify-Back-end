import { Inbound } from '$src/domains/inbound/models/Inbound';
import { repo } from '$src/infra/utils/repo';
import { capitalCase } from 'case-anything';
import { Fragment, h } from 'nano-jsx';
import QRCode from 'qrcode';
import { DocumentBuilder } from '../Builder';
import { App } from '../components/App';
import { Footer } from '../components/Footer';
import { Header } from '../components/Header';
import { Section } from '../components/Section';
import { Signature, SignatureContainer } from '../components/Signature';
import { Table, Td, Th, Tr } from '../components/Table';
import { formatDate, loadSignature } from '../utils';

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

  getPdfName() {
    return `${this.inbound.code}.pdf`;
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
              {formatDate(inbound.createdAt)} {}
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
        </tbody>
      </Table>
    );
  };
}
