import { Outbound } from '$src/domains/outbound/models/Outbound';
import { repo } from '$src/infra/utils/repo';
import { capitalCase } from 'case-anything';
import { Fragment, h } from 'nano-jsx';
import * as QrCode from 'qrcode';
import { DocumentBuilder } from '../Builder';
import { App } from '../components/App';
import { Footer } from '../components/Footer';
import { Header } from '../components/Header';
import { Section } from '../components/Section';
import { Signature, SignatureContainer } from '../components/Signature';
import { Table, Td, Th, Tr } from '../components/Table';
import { formatDate, loadSignature } from '../utils';
import { getAsLink } from '$src/domains/qrcode/utils';

export class OutboundDocument extends DocumentBuilder {
  outbound!: Outbound;
  creatorSign!: Buffer | null;
  driverSign!: Buffer | null;
  customerSign!: Buffer | null;
  qrcode!: string;

  async loadProps(): Promise<void> {
    this.outbound = await repo(Outbound).findOneOrFail({
      where: {
        id: this.entity.typeId,
      },
      relations: {
        products: {
          product: {
            unit: true,
          },
        },
        driver: true,
        creator: true,
      },
    });

    this.creatorSign = this.outbound.creatorSignature
      ? await loadSignature(this.outbound.creatorSignature)
      : null;

    this.driverSign = this.outbound.driverSignature
      ? await loadSignature(this.outbound.driverSignature)
      : null;

    this.driverSign = this.outbound.creatorSignature
      ? await loadSignature(this.outbound.creatorSignature)
      : null;

    this.qrcode = await QrCode.toDataURL(getAsLink(this.outbound.code));
  }

  getPdfName() {
    return `${this.outbound.code}.pdf`;
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
              {this.customerSign ? (
                <Signature
                  label="Customer signature"
                  signature={this.customerSign}
                />
              ) : (
                <Signature
                  label="Clerk signature"
                  signature={this.creatorSign}
                />
              )}
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
            <span class="text-gray">DN Status</span>
          </div>
          <div class="text-gray bold">
            ◯ {capitalCase(this.outbound.status.replaceAll('_', ' '))}
          </div>
        </div>
      </div>
    );

    return <Header title="Outbound" info={Info} />;
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
    const { outbound } = this;
    return (
      <div class="d-flex flex-row">
        <div class="d-flex flex-wrap px-1 w-100">
          <div class="d-flex flex-column mb-1 w-50">
            <label class="text-gray">DN Code</label>
            <p>{outbound.code}</p>
          </div>
          <div class="d-flex flex-column mb-1 w-50">
            <label class="text-gray">Clerk</label>
            <p>{outbound.creator.fullName}</p>
          </div>
          <div class="d-flex flex-column mb-1 w-50">
            <label class="text-gray">Date</label>
            <p>
              {formatDate(outbound.createdAt)} {}
            </p>
          </div>
          <div class="d-flex flex-column mb-1 w-50">
            <label class="text-gray">Driver</label>
            <p>{outbound.driver?.fullName ?? '-'}</p>
          </div>
        </div>
        <div>
          <image src={this.qrcode}></image>
        </div>
      </div>
    );
  };

  ProductsTable = () => {
    const { outbound } = this;
    return (
      <Table>
        <colgroup>
          <col span="1" style="width: 10%" />
          <col span="1" style="width: 75%" />
          <col span="1" style="width: 15%" />
        </colgroup>
        <thead>
          <Tr>
            <Th>Index</Th>
            <Th>Product</Th>
            <Th>DN Quantity</Th>
          </Tr>
        </thead>
        <tbody>
          {outbound.products.map((e, index) => (
            <Tr>
              <Td>{index}</Td>
              <Td>{e.product.name}</Td>
              <Td>
                {e.quantity} / {e.product.unit?.name}
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    );
  };
}
