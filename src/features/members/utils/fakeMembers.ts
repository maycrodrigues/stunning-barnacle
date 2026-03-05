import { faker } from '@faker-js/faker';
import { ulid } from 'ulid';
import { Member } from '../../../shared/services/db';

export const generateFakeMember = (overrides?: Partial<Member>): Member => {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  
  return {
    id: ulid(),
    tenantId: 'default-tenant',
    name: `${firstName} ${lastName}`,
    email: faker.internet.email({ firstName, lastName }),
    phone: faker.phone.number(),
    address: faker.location.streetAddress({ useFullAddress: true }),
    photo: faker.image.avatar(),
    roleId: faker.helpers.arrayElement(['coord', 'assessor', 'admin']),
    social: {
      instagram: faker.internet.username({ firstName, lastName }),
      facebook: faker.internet.username({ firstName, lastName }),
      linkedin: faker.internet.username({ firstName, lastName }),
      x: faker.internet.username({ firstName, lastName }),
    },
    active: true,
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    synced: 0,
    ...overrides,
  } as Member;
};

export const generateFakeMembers = (count: number = 10): Member[] => {
  return Array.from({ length: count }, () => generateFakeMember());
};
