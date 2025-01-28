import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { GenreService } from './genre.service';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';

@Controller('genre')
export class GenreController {
    constructor(private readonly genreService: GenreService) {}

    @Get()
    getGenres() {
        return this.genreService.findAll();
    }

    @Get(':id')
    getGenre(@Param('id') id: string) {
        return this.genreService.findOne(+id);
    }

    @Post()
    postGenre(@Body() createGenreDto: CreateGenreDto) {
        return this.genreService.create(createGenreDto);
    }

    @Patch(':id')
    patchGenre(@Param('id') id: string, @Body() updateGenreDto: UpdateGenreDto) {
        return this.genreService.update(+id, updateGenreDto);
    }

    @Delete(':id')
    deleteGenre(@Param('id') id: string) {
        return this.genreService.remove(+id);
    }
}
