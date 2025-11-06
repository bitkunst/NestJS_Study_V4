import { Test, TestingModule } from '@nestjs/testing';
import { GenreController } from './genre.controller';
import { GenreService } from './genre.service';
import { CreateGenreDto } from './dto/create-genre.dto';
import { Genre } from './entity/genre.entity';

const mockGenreService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
};

describe('GenreController', () => {
    let genreController: GenreController;
    let genreService: GenreService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [GenreController],
            providers: [
                {
                    provide: GenreService,
                    useValue: mockGenreService,
                },
            ],
        }).compile();

        genreController = module.get<GenreController>(GenreController);
        genreService = module.get<GenreService>(GenreService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(genreController).toBeDefined();
    });

    describe('postGenre', () => {
        it('should call genreService.create with correct parameter', async () => {
            const createGenreDto = {
                name: 'Fantasy',
            };
            const result = { id: 1, ...createGenreDto };
            jest.spyOn(mockGenreService, 'create').mockResolvedValue(result as CreateGenreDto & Genre);

            expect(genreController.postGenre(createGenreDto)).resolves.toEqual(result);
            expect(genreService.create).toHaveBeenCalledWith(createGenreDto);
        });
    });

    describe('getGenres', () => {
        it('should call genreService.findAll and return an array of genres', async () => {
            const result = [
                {
                    id: 1,
                    name: 'Fantasy',
                },
            ];
            jest.spyOn(mockGenreService, 'findAll').mockResolvedValue(result as Genre[]);

            expect(genreController.getGenres()).resolves.toEqual(result);
            expect(genreService.findAll).toHaveBeenCalled();
        });
    });

    describe('getGenre', () => {
        it('should call genreService.findOne with correct id and return the genre', async () => {
            const id = 1;
            const result = {
                id: 1,
                name: 'Fantasy',
            };
            jest.spyOn(mockGenreService, 'findOne').mockResolvedValue(result);

            expect(genreController.getGenre(id)).resolves.toEqual(result);
            expect(genreService.findOne).toHaveBeenCalledWith(id);
        });
    });

    describe('patchGenre', () => {
        it('should call genreService.update with correct parameters and return updated genre', async () => {
            const id = 1;
            const updateGenreDto = {
                name: 'Updated Fantasy',
            };
            const result = {
                id: 1,
                ...updateGenreDto,
            };
            jest.spyOn(mockGenreService, 'update').mockResolvedValue(result as Genre);

            expect(genreController.patchGenre(id, updateGenreDto)).resolves.toEqual(result);
            expect(genreService.update).toHaveBeenCalledWith(id, updateGenreDto);
        });
    });

    describe('deleteGenre', () => {
        it('should call genreService.remove with correct id and return id of the removed genre', async () => {
            const id = 1;
            jest.spyOn(mockGenreService, 'remove').mockResolvedValue(id);

            expect(genreController.deleteGenre(id)).resolves.toBe(id);
            expect(genreService.remove).toHaveBeenCalledWith(id);
        });
    });
});
