import { Product } from './models/Product';
import { BinProduct } from './models/BinProduct';
import { Bin } from '../warehouse/models/Bin';
import { repo } from '$src/infra/utils/repo';
import { Inbound } from '../inbound/models/Inbound';
import { Outbound } from '../outbound/models/Outbound';
import { createError } from '@fastify/error';
import { ProductMovementHistory } from './models/ProductMovementHistory';

import assert from 'assert';

const QUANTITY_OUT_OF_RANGE = createError(
  'QUANTITY_OUT_OF_RANGE',
  'quantity out of range',
  400,
);
const Products = repo(Product);
const BinProducts = repo(BinProduct);
const ProductMovementHistories = repo(ProductMovementHistory);

async function addAsset(product: Product, bin: Bin, quantity: number) {
  let binProduct = await BinProducts.createQueryBuilder('BinProduct')
    .where('binId = :binId AND productId = :productId', {
      binId: bin.id,
      productId: product.id,
    })
    .getOne();

  if (!binProduct) {
    binProduct = await BinProducts.create({ bin, product });
  }

  binProduct.quantity = binProduct.quantity + quantity;
  await BinProducts.save(binProduct);

  product.quantity = product.quantity + quantity;
  await Products.save(product);
}

async function subtractAsset(product: Product, bin: Bin, quantity: number) {
  const binProduct = await BinProducts.createQueryBuilder('BinProduct')
    .where('binId = :binId AND productId = :productId', {
      binId: bin.id,
      productId: product.id,
    })
    .getOne();

  assert(binProduct, `there is no BinProduct to subtract assets from it.`);

  if (binProduct.quantity < quantity) {
    throw new QUANTITY_OUT_OF_RANGE();
  }

  binProduct.quantity = binProduct.quantity - quantity;

  await BinProducts.save(binProduct);

  if (!binProduct.quantity) {
    await BinProducts.remove(binProduct);
  }
}

export async function moveProduct(
  product: Product,
  sourceBin: Bin,
  targetBin: Bin,
  quantity: number,
) {
  await subtractAsset(product, sourceBin, quantity);
  await addAsset(product, targetBin, quantity);
  await recordMovement(
    product,
    { id: sourceBin.id, type: 'bin' },
    targetBin,
    quantity,
  );
}

export async function addProductToBin(
  product: Product,
  comeFrom: Inbound | null,
  to: Bin,
  quantity: number,
) {
  await addAsset(product, to, quantity);
  await recordMovement(
    product,
    comeFrom ? { id: comeFrom.id, type: 'inbound' } : { id: null, type: null },
    to,
    quantity,
  );
}

export async function subtractProductFromBin(
  product: Product,
  comeFrom: Outbound,
  from: Bin,
  quantity: number,
) {
  await subtractAsset(product, from, quantity);
  await recordMovement(
    product,
    { id: comeFrom.id, type: 'outbound' },
    from,
    quantity,
  );
}

async function recordMovement(
  product: Product,
  source: { id: number | null; type: 'bin' | 'inbound' | 'outbound' | null },
  targetBin: Bin,
  quantity: number,
) {
  await ProductMovementHistories.create({
    product,
    sourceId: source.id,
    sourceType: source.type,
    bin: targetBin,
    quantity,
  });
}
