import { repo } from '$src/infra/utils/repo';
import { Customer } from '../customer/models/Customer';
import { User } from '../user/models/User';
import { INVALID_CUSTOMER_ID, INVALID_USER_ID } from './errors';
import { Outbound, ReceiverType } from './models/Outbound';

export interface Receiver {
  type: ReceiverType;
  typeId: number;
  name: string;
  email: string | null;
}

const customersRepo = repo(Customer);
const usersRepo = repo(User);

export async function loadReceiver({
  receiverType,
  receiverId,
}: Outbound): Promise<Receiver | null> {
  if (!receiverType || !receiverId) return null;

  switch (receiverType) {
    case ReceiverType.CUSTOMER: {
      const customer = await customersRepo.findOne({
        where: { id: receiverId },
        relations: { contacts: true },
      });
      if (!customer) return null;
      return {
        type: receiverType,
        typeId: receiverId,
        name: customer.name,
        email: customer.contacts[0]?.email ?? null,
      };
    }

    case ReceiverType.USER: {
      const user = await usersRepo.findOne({
        where: { id: receiverId },
      });
      if (!user) return null;
      return {
        type: receiverType,
        typeId: receiverId,
        name: user.fullName,
        email: user.email,
      };
    }
  }
}

export async function validateReceiver({
  receiverType,
  receiverId,
}: {
  receiverType: ReceiverType;
  receiverId: number;
}) {
  if (!receiverType || !receiverId) return null;

  // validate receiver
  if (receiverType === ReceiverType.CUSTOMER) {
    const customer = await customersRepo.findOneBy({
      id: receiverId,
    });
    if (!customer) throw new INVALID_CUSTOMER_ID(receiverId);
  }

  if (receiverType === ReceiverType.USER) {
    const user = await usersRepo.findOneBy({
      id: receiverId,
    });
    if (!user) throw new INVALID_USER_ID(receiverId);
  }
}
