import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entity/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

const mockedUserService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
};

describe('UserController', () => {
    let userController: UserController;
    let userService: UserService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [UserController],
            providers: [
                {
                    provide: UserService,
                    useValue: mockedUserService,
                },
            ],
        }).compile();

        userController = module.get<UserController>(UserController);
        userService = module.get<UserService>(UserService);
    });

    afterEach(() => {
        // 테스트 실행할 때마다 jest Mock 함수 초기화
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(userController).toBeDefined();
    });

    describe('postUser', () => {
        it('should return correct value', async () => {
            const createUserDto: CreateUserDto = {
                email: 'test@gmail.com',
                password: '123123',
            };
            const user = {
                id: 1,
                ...createUserDto,
                password: 'hashedPassword',
            };
            jest.spyOn(userService, 'create').mockResolvedValue(user as User);

            const result = await userController.postUser(createUserDto);

            expect(userService.create).toHaveBeenCalledWith(createUserDto);
            expect(result).toEqual(user);
        });
    });

    describe('getUsers', () => {
        it('should return a list of users', async () => {
            const users = [
                {
                    id: 1,
                    email: 'test@gmail.com',
                },
                {
                    id: 2,
                    email: 'test2@gmail.com',
                },
            ];
            jest.spyOn(userService, 'findAll').mockResolvedValue(users as User[]);

            const result = await userController.getUsers();

            expect(userService.findAll).toHaveBeenCalled();
            expect(result).toEqual(users);
        });
    });

    describe('getUser', () => {
        it('should return a single user', async () => {
            const user = {
                id: 1,
                email: 'test@gmail.com',
            };
            jest.spyOn(userService, 'findOne').mockResolvedValue(user as User);

            const result = await userController.getUser(1);

            expect(userService.findOne).toHaveBeenCalledWith(1);
            expect(result).toEqual(user);
        });
    });

    describe('patchUser', () => {
        it('should return the updated user', async () => {
            const id = 1;
            const updateUserDto: UpdateUserDto = {
                email: 'admin@gmail.com',
            };
            const user = {
                id,
                email: 'test@gmail.com',
            };
            jest.spyOn(userService, 'update').mockResolvedValue(user as User);

            const result = await userController.patchUser(1, updateUserDto);

            expect(userService.update).toHaveBeenCalledWith(1, updateUserDto);
            expect(result).toEqual(user);
        });
    });

    describe('deleteUser', () => {
        it('should return a user id', async () => {
            const id = 1;
            jest.spyOn(userService, 'remove').mockResolvedValue(id);

            const result = await userController.deleteUser(1);

            expect(userService.remove).toHaveBeenCalledWith(1);
            expect(result).toEqual(id);
        });
    });
});
