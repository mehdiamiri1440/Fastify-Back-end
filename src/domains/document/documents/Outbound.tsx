import { h } from 'nano-jsx';
import { DocumentBuilder } from '../Builder';
import { App } from '../components/App';
import { Section } from '../components/Section';

export class OutboundDocument extends DocumentBuilder {
  async loadProps(): Promise<void> {
    console.log(this.entity);
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
          <h1>TODO</h1>
        </Section>
      </App>
    );
  }
}
