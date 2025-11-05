import { Test, TestingModule } from '@nestjs/testing';
import { DirectorController } from './director.controller';
import { DirectorService } from './director.service';
import { CreateDirectorDto } from './dto/create-director.dto';

const mockDirectorService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
};

describe('DirectorController', () => {
    let directorController: DirectorController;
    let directorService: DirectorService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [DirectorController],
            providers: [
                {
                    provide: DirectorService,
                    useValue: mockDirectorService,
                },
            ],
        }).compile();

        directorController = module.get<DirectorController>(DirectorController);
        directorService = module.get<DirectorService>(DirectorService);
    });

    it('should be defined', () => {
        expect(directorController).toBeDefined();
    });

    describe('getDirectors', () => {
        it('should call findAll method from DirectorService', async () => {
            const result = [{ id: 1, name: 'bitkunst' }];
            jest.spyOn(mockDirectorService, 'findAll').mockResolvedValue(result);

            expect(directorController.getDirectors()).resolves.toEqual(result);
            expect(directorService.findAll).toHaveBeenCalled();
        });
    });

    describe('getDirector', () => {
        it('should call findOne method from DirectorService with correct ID', async () => {
            const result = { id: 1, name: 'bitkunst' };
            jest.spyOn(mockDirectorService, 'findOne').mockResolvedValue(result);

            expect(directorController.getDirector(1)).resolves.toEqual(result);
            expect(directorService.findOne).toHaveBeenCalledWith(1);
        });
    });

    describe('postDirector', () => {
        it('should call create method from DirectorService with correct DTO', async () => {
            const createDirectorDto = { name: 'bitkunst' };
            const result = { id: 1, name: 'bitkunst' };
            jest.spyOn(mockDirectorService, 'create').mockResolvedValue(result);

            expect(directorController.postDirector(createDirectorDto as CreateDirectorDto)).resolves.toEqual(result);
            expect(directorService.create).toHaveBeenCalledWith(createDirectorDto);
        });
    });

    describe('patchDirector', () => {
        it('should call update method from DirectorService with correct ID and DTO', async () => {
            const updateDirectorDto = { name: 'bikunst' };
            const result = { id: 1, name: 'bitkunst' };
            jest.spyOn(mockDirectorService, 'update').mockResolvedValue(result);

            expect(directorController.patchDirector(1, updateDirectorDto)).resolves.toEqual(result);
            expect(directorService.update).toHaveBeenCalledWith(1, updateDirectorDto);
        });
    });

    describe('deleteDirector', () => {
        it('should call remove method from DirectorService with correct ID', async () => {
            const result = 1;
            jest.spyOn(mockDirectorService, 'remove').mockResolvedValue(result);

            expect(directorController.deleteDirector(1)).resolves.toEqual(result);
            expect(directorService.remove).toHaveBeenCalledWith(1);
        });
    });
});
