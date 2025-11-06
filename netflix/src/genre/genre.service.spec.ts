import { Test, TestingModule } from '@nestjs/testing';
import { GenreService } from './genre.service';
import { Repository } from 'typeorm';
import { Genre } from './entity/genre.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';

const mockGenreRepository = {
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
};

describe('GenreService', () => {
    let genreService: GenreService;
    let genreRepository: Repository<Genre>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GenreService,
                {
                    provide: getRepositoryToken(Genre),
                    useValue: mockGenreRepository,
                },
            ],
        }).compile();

        genreService = module.get<GenreService>(GenreService);
        genreRepository = module.get<Repository<Genre>>(getRepositoryToken(Genre));
    });

    afterAll(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(genreService).toBeDefined();
    });

    describe('create', () => {
        it('should create a genre successfully', async () => {
            const createGenreDto = { name: 'Fantasy' };
            const savedGenre = { id: 1, ...createGenreDto };
            jest.spyOn(mockGenreRepository, 'save').mockResolvedValue(savedGenre as Genre);

            const result = await genreService.create(createGenreDto);

            expect(genreRepository.save).toHaveBeenCalledWith(createGenreDto);
            expect(result).toEqual(savedGenre);
        });

        it('should throw a BadRequestException if genre to create already exists', async () => {
            const createGenreDto = { name: 'Fantasy' };
            const existingGenre = { id: 1, ...createGenreDto };
            jest.spyOn(mockGenreRepository, 'findOne').mockResolvedValue(existingGenre);

            expect(genreService.create(createGenreDto)).rejects.toThrow(BadRequestException);
        });
    });

    describe('findAll', () => {
        it('should return an array of genres', async () => {
            const genres = [
                {
                    id: 1,
                    name: 'Fantasy',
                },
            ];
            jest.spyOn(mockGenreRepository, 'find').mockResolvedValue(genres as Genre[]);

            const result = await genreService.findAll();

            expect(genreRepository.find).toHaveBeenCalled();
            expect(result).toEqual(genres);
        });
    });

    describe('findOne', () => {
        it('should return a genre if found', async () => {
            const genre = { id: 1, name: 'Fantasy' };
            jest.spyOn(mockGenreRepository, 'findOne').mockResolvedValue(genre as Genre);

            const result = await genreService.findOne(genre.id);

            expect(genreRepository.findOne).toHaveBeenCalledWith({ where: { id: genre.id } });
            expect(result).toEqual(genre);
        });

        it('should throw a NotFoundException if genre is not found', async () => {
            jest.spyOn(mockGenreRepository, 'findOne').mockResolvedValue(null);

            expect(genreService.findOne(1)).rejects.toThrow(NotFoundException);
        });
    });

    describe('update', () => {
        it('should update and return the genre if it exists', async () => {
            const updateGenreDto = {
                name: 'Updated Fantasy',
            };
            const existingGenre = {
                id: 1,
                name: 'Fantasy',
            };
            const updatedGenre = {
                id: 1,
                ...updateGenreDto,
            };
            jest.spyOn(mockGenreRepository, 'findOne')
                .mockResolvedValueOnce(existingGenre as Genre)
                .mockResolvedValueOnce(updatedGenre as Genre);

            const result = await genreService.update(1, updateGenreDto);

            expect(genreRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
            expect(genreRepository.update).toHaveBeenCalledWith({ id: 1 }, updateGenreDto);
            expect(result).toEqual(updatedGenre);
        });

        it('should throw a NotFoundException if genre to update does not exist', async () => {
            jest.spyOn(mockGenreRepository, 'findOne').mockResolvedValue(null);

            expect(genreService.update(1, { name: 'Updated Fantasy' })).rejects.toThrow(NotFoundException);
        });
    });

    describe('remove', () => {
        it('should delete a genre and return the id', async () => {
            const genre = {
                id: 1,
                name: 'Fantasy',
            };
            jest.spyOn(mockGenreRepository, 'findOne').mockResolvedValue(genre as Genre);

            const result = await genreService.remove(1);

            expect(genreRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
            expect(genreRepository.delete).toHaveBeenCalledWith(1);
            expect(result).toBe(1);
        });

        it('should throw a NotFoundException if genre to delete does not exist', () => {
            jest.spyOn(mockGenreRepository, 'findOne').mockResolvedValue(null);

            expect(genreService.remove(1)).rejects.toThrow(NotFoundException);
        });
    });
});
