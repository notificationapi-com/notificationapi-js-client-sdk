import { faker } from '@faker-js/faker';
import { InappNotification } from '../interfaces';

export const generateFakeNotifications = (
  count: number
): InappNotification[] => {
  const result = [];
  for (let index = 0; index < count; index++) {
    result.push({
      id: 'fake-' + index.toString(),
      seen: false,
      title:
        `<b>${faker.name.firstName()}</b> posted an update: ${faker.lorem.sentence()}` +
        index,
      redirectURL: '#',
      imageURL: faker.image.avatar(),
      date: new Date(new Date().getTime() - index * 3600).toISOString()
    });
  }

  return result;
};
