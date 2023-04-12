import { h, Fragment } from 'nano-jsx';
import { DocumentBuilder } from '../Builder';
import { App } from '../components/App';
import { Section } from '../components/Section';

export class InboundDocument extends DocumentBuilder {
  async loadProps(): Promise<void> {
    console.log('hey');
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
          <h1>Hey</h1>
        </Section>
      </App>
    );
  }
}
