import { dto } from './dto';
import { validate } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

describe('dto', () => {
  it('should work', () => {
    expect(dto()).toEqual('dto');
  });
});

describe('CreateUserDto', () => {
  it('accepts a non-empty username', async () => {
    const input = Object.assign(new CreateUserDto(), {
      username: 'rider',
      email: 'rider@example.com',
      password: 'password123',
    });

    await expect(validate(input)).resolves.toHaveLength(0);
  });

  it('rejects a missing username', async () => {
    const input = Object.assign(new CreateUserDto(), {
      email: 'rider@example.com',
      password: 'password123',
    });

    const errors = await validate(input);

    expect(errors.some(({ property }) => property === 'username')).toBe(true);
  });

  it('rejects a whitespace-only username', async () => {
    const input = Object.assign(new CreateUserDto(), {
      username: '   ',
      email: 'rider@example.com',
      password: 'password123',
    });

    const errors = await validate(input);

    expect(errors.some(({ property }) => property === 'username')).toBe(true);
  });
});
