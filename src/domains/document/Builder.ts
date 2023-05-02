import { Document } from './models/Document';
import { Repository } from 'typeorm';
import Nano, { h, Helmet } from 'nano-jsx';
import { Bundler, DocumentBundle } from './Bundler';
import { Cache } from './Cache';
import assert from 'assert';

export abstract class DocumentBuilder {
  repo: Repository<Document>;
  entity: Document;
  protected bundler = new Bundler();
  protected cache: Cache;
  #loaded = false;

  protected abstract render(): JSX.IntrinsicElements;
  abstract getPdfName(): string;
  protected abstract loadProps(): Promise<void>;

  constructor(repo: Repository<Document>, entity: Document) {
    this.repo = repo;
    this.entity = entity;
    this.cache = new Cache(this.entity.id.toString());
  }

  get id() {
    return this.entity.id;
  }

  async load() {
    await this.loadProps();
    this.#loaded = true;
  }

  async #getBundleVerifyCache(): Promise<DocumentBundle> {
    const html = this.getHtml();
    const cacheKey = this.bundler.getCacheKey(html);
    const fromCache = await this.cache.get(cacheKey);

    if (fromCache) return fromCache;

    const pdfName = this.getPdfName();
    const bundle = await this.bundler.fromHtml(html, pdfName);
    await this.cache.save(bundle);
    return bundle;
  }

  async #getBundleFast(): Promise<DocumentBundle> {
    const fromCache = await this.cache.get();
    if (fromCache) return fromCache;
    const html = this.getHtml();
    const pdfName = this.getPdfName();
    const bundle = await this.bundler.fromHtml(html, pdfName);
    await this.cache.save(bundle);
    return bundle;
  }

  getBundled({
    verifyCache,
  }: {
    verifyCache: boolean;
  }): Promise<DocumentBundle> {
    return verifyCache ? this.#getBundleVerifyCache() : this.#getBundleFast();
  }

  getHtml(): string {
    assert(this.#loaded, 'document not loaded yet');
    const app = Nano.renderSSR(() => this.render());
    const rendered = Helmet.SSR(app);
    return rendered.body;
  }
}
